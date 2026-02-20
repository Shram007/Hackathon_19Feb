import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAgUI } from "ag-ui";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_OPENCLAW_URL) ||
  (typeof process !== "undefined" &&
    (process.env.VITE_OPENCLAW_URL || process.env.NEXT_PUBLIC_OPENCLAW_URL)) ||
  "http://localhost:8000";

const TERMINAL = new Set(["succeeded", "failed", "cancelled", "completed", "error", "rejected"]);

export function useOpenClaw({ pollInterval = 1200 } = {}) {
  const [run, setRun] = useState(null);
  const [pendingTools, setPendingTools] = useState([]);
  const [activeTool, setActiveTool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const { emit } = useAgUI?.() || { emit: null };

  const emitAg = useCallback(
    (type, payload = {}) => {
      if (emit) {
        emit({ type, payload });
      } else {
        // eslint-disable-next-line no-console
        console.debug("AG-UI event", type, payload);
      }
    },
    [emit]
  );

  const normalizeTools = useCallback((tools) => {
    if (!Array.isArray(tools)) return [];
    return tools.filter((tool) => {
      const status = tool.status || tool.state;
      return status === "pending" || tool.requires_approval;
    });
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchRun = useCallback(
    async (id) => {
      if (!id) return null;
      const res = await fetch(`${API_BASE}/runs/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch run ${id}`);
      const data = await res.json();
      setRun(data);
      const waiting = normalizeTools(data.tools);
      setPendingTools(waiting);
      setActiveTool(waiting[0] || null);
      emitAg("statusUpdate", { id: data.id, status: data.status, tools: waiting });
      if (TERMINAL.has(data.status)) stopPolling();
      return data;
    },
    [emitAg, normalizeTools, stopPolling]
  );

  const startRun = useCallback(
    async (messages) => {
      setLoading(true);
      setError(null);
      emitAg("beginRendering", { scope: "openclaw-run" });
      try {
        const payload =
          messages && messages.length
            ? { messages }
            : { messages: [{ role: "user", content: "triage inbox" }] };
        const res = await fetch(`${API_BASE}/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to start run");
        const data = await res.json();
        setRun(data);
        const waiting = normalizeTools(data.tools);
        setPendingTools(waiting);
        setActiveTool(waiting[0] || null);
        emitAg("agentMessage", { role: "assistant", content: "Run started" });
        emitAg("surfaceUpdate", {
          title: "OpenClaw run",
          summary: data.id,
          status: data.status,
        });
        emitAg("dataModelUpdate", { run: data });
        if (data.id) {
          await fetchRun(data.id);
          pollRef.current = setInterval(() => fetchRun(data.id), pollInterval);
        }
        return data;
      } catch (err) {
        setError(err.message);
        emitAg("surfaceUpdate", { title: "OpenClaw error", summary: err.message, status: "error" });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [emitAg, fetchRun, normalizeTools, pollInterval]
  );

  const approveTool = useCallback(
    async (toolId, action = "approve", payload = {}) => {
      if (!run?.id) throw new Error("No active run");
      const res = await fetch(`${API_BASE}/runs/${run.id}/tools/${toolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      if (!res.ok) throw new Error(`Failed to ${action} tool ${toolId}`);
      const data = await res.json();
      setRun((prev) => (prev?.id === run.id ? { ...prev, ...data } : prev));
      const waiting = normalizeTools(data.tools || []);
      setPendingTools(waiting);
      setActiveTool(waiting[0] || null);
      emitAg("humanInput", { toolId, action, payload });
      emitAg("dataModelUpdate", { run: data });
      return data;
    },
    [emitAg, normalizeTools, run?.id]
  );

  useEffect(() => stopPolling, [stopPolling]);

  const isRunning = useMemo(() => (run?.status ? !TERMINAL.has(run.status) : false), [run?.status]);

  return {
    run,
    pendingTools,
    activeTool,
    loading,
    error,
    isRunning,
    startRun,
    approveTool,
    refresh: fetchRun,
    stopPolling,
    emitAg,
  };
}
