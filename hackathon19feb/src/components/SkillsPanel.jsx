"use client";

import { useEffect, useMemo, useState } from "react";
import { useAgUI } from "@ag-ui/react";
import { ExternalLink, Play } from "lucide-react";

const widgets = [
  { id: "invoice", label: "Invoice widget", surface: "openclaw-canvas://main/widgets/invoice/" },
  { id: "todo", label: "Todo widget", surface: "openclaw-canvas://main/widgets/todo/" },
];

const cn = (...classes) => classes.filter(Boolean).join(" ");

export function SkillsPanel() {
  const { emit } = useAgUI?.() || { emit: null };
  const [enabled, setEnabled] = useState(() => ({ invoice: false, todo: false }));
  const [loading, setLoading] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!emit) return;
    emit({ type: "surfaceUpdate", payload: { skills: enabled, status: "synced" } });
  }, [emit, enabled]);

  const toggleSkill = async (id) => {
    const next = !enabled[id];
    setEnabled((prev) => ({ ...prev, [id]: next }));
    setLoading(id);
    setMessage("");
    if (emit) {
      emit({ type: "surfaceUpdate", payload: { skill: id, status: "pending" } });
    }
    try {
      await fetch("/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: id, enabled: next }),
      });
      if (emit) {
        emit({ type: "createSurface", payload: { id, url: widgets.find((w) => w.id === id)?.surface } });
        emit({ type: "surfaceUpdate", payload: { skill: id, status: "synced" } });
      }
      setMessage(`Skill ${id} ${next ? "enabled" : "disabled"}`);
    } catch (err) {
      setMessage(`Skill ${id} failed: ${err.message}`);
      if (emit) emit({ type: "surfaceUpdate", payload: { skill: id, status: "error", error: err.message } });
    } finally {
      setLoading(null);
    }
  };

  const deepLinks = useMemo(
    () => [
      { label: "Open Canvas Invoice", href: "openclaw-canvas://main/widgets/invoice/" },
      { label: "Deep Link: triage inbox", href: "openclaw://agent?message=triage%20inbox" },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Skills Panel</p>
          <h2 className="text-xl font-semibold">OpenClaw Canvas</h2>
        </div>
      </div>

      <div className="space-y-3">
        {widgets.map((w) => (
          <div key={w.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">{w.label}</p>
              <p className="text-xs text-slate-400 truncate">{w.surface}</p>
            </div>
            <button
              onClick={() => toggleSkill(w.id)}
              disabled={loading === w.id}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold border",
                enabled[w.id] ? "bg-emerald-500 text-emerald-950 border-emerald-400" : "bg-slate-800 text-white border-slate-600",
                loading === w.id && "opacity-60"
              )}
            >
              {enabled[w.id] ? "Disable" : "Enable"}
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Canvas links</p>
        {deepLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 text-sm text-blue-200 hover:text-white"
          >
            <ExternalLink size={14} /> {link.label}
          </a>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Snapshot</p>
        <p className="text-xs text-slate-400">
          Capture current UI state to Canvas/OpenClaw via surfaceUpdate snapshot event.
        </p>
        <button
          onClick={() => {
            if (emit) emit({ type: "surfaceUpdate", payload: { snapshot: { skills: enabled }, status: "snapshot" } });
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
        >
          <Play size={14} /> Capture snapshot
        </button>
      </div>

      {message && <p className="text-xs text-slate-300">{message}</p>}
    </div>
  );
}
