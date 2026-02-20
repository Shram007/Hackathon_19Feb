"use client";

import { useEffect, useMemo, useState } from "react";
import { Surface } from "@contextableai/clawg-ui";
import { useAgUI } from "ag-ui";
import { useCopilotReadable } from "@copilotkit/react-core";

export function ApprovalModal({ run, tool, open = false, onApprove }) {
  const { emit } = useAgUI?.() || { emit: null };
  const [jsonBody, setJsonBody] = useState(() => JSON.stringify(tool?.payload || {}, null, 2));
  const safetyScore =
    typeof useCopilotReadable === "function"
      ? useCopilotReadable({ name: "safetyScore", initialValue: 0 })
      : 0;

  useEffect(() => {
    if (emit && open) {
      emit({
        type: "surfaceUpdate",
        payload: {
          title: "Tool approval",
          runId: run?.id,
          toolId: tool?.id,
          summary: tool?.name || "Tool",
          status: tool?.status || "pending",
        },
      });
    }
  }, [emit, open, run?.id, tool]);

  useEffect(() => {
    if (emit && run) {
      emit({ type: "dataModelUpdate", payload: { safetyScore } });
    }
  }, [emit, run, safetyScore]);

  const parsedPayload = useMemo(() => {
    try {
      return JSON.parse(jsonBody || "{}");
    } catch (err) {
      return null;
    }
  }, [jsonBody]);

  const handleApprove = (approved) => {
    if (!tool?.id || !run?.id) return;
    if (emit) {
      emit({
        type: "humanInput",
        payload: {
          runId: run.id,
          toolId: tool.id,
          action: approved ? "approve" : "reject",
          payload: parsedPayload || {},
        },
      });
    }
    if (onApprove) onApprove(run.id, tool.id, approved, parsedPayload || {});
  };

  return (
    <Surface
      open={open}
      title={tool?.name || "Pending tool"}
      subtitle={`Run ${run?.id || "-"}`}
      status={tool?.status || "pending"}
      onApprove={() => handleApprove(true)}
      onReject={() => handleApprove(false)}
    >
      <div className="flex flex-col gap-3 text-sm">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Safety score: {safetyScore}
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Tool payload</label>
        <textarea
          value={jsonBody}
          onChange={(e) => setJsonBody(e.target.value)}
          className="min-h-[160px] w-full rounded-lg border border-border bg-black/40 p-3 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
        />
        {parsedPayload === null && (
          <p className="text-amber-300">Invalid JSON. Fix before approving.</p>
        )}
      </div>
    </Surface>
  );
}
