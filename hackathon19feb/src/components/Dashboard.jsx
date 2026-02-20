"use client";

import { useMemo, useState } from "react";
import { useOpenClaw } from "@/hooks/useOpenClaw";
import { SkillsPanel } from "./SkillsPanel";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const Button = ({ variant = "default", size = "md", className = "", ...props }) => {
  const base =
    "inline-flex items-center justify-center rounded-lg font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const variants = {
    default: "bg-white text-slate-900 hover:bg-slate-200 focus-visible:outline-white",
    secondary: "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 focus-visible:outline-slate-300",
    ghost: "bg-transparent text-white hover:bg-white/10 border border-white/10 focus-visible:outline-white/60",
  };
  const sizes = {
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
};

const Badge = ({ variant = "secondary", className = "", ...props }) => {
  const base = "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium";
  const variants = {
    secondary: "bg-white/10 text-white border border-white/20",
    outline: "border border-white/30 text-white",
    success: "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30",
    warning: "bg-amber-500/20 text-amber-100 border border-amber-400/40",
  };
  return <span className={cn(base, variants[variant], className)} {...props} />;
};

const Card = ({ className = "", children }) => (
  <div className={cn("rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl", className)}>
    {children}
  </div>
);

export default function Dashboard() {
  const [prompt, setPrompt] = useState("triage inbox");
  const { run, pendingTools, isRunning, loading, error, startRun, approveTool, emitAg } = useOpenClaw({ pollInterval: 1400 });

  const statusTone = useMemo(() => {
    if (error) return { label: "Error", badge: "warning" };
    if (!run) return { label: "Idle", badge: "outline" };
    if (isRunning) return { label: "Running", badge: "secondary" };
    return { label: "Finished", badge: "success" };
  }, [error, isRunning, run]);

  const tasks = [
    { title: "Inbox triage", desc: "Sweep priority emails and summarize decisions." },
    { title: "Vendor updates", desc: "Pull latest vendor tickets and flag blockers." },
    { title: "On-call brief", desc: "Condense overnight alerts into a digest." },
    { title: "Product QA", desc: "Check staging regressions and open approvals." },
    { title: "Security sweep", desc: "List pending approvals in auth flows." },
    { title: "Data sync", desc: "Validate recent ETL jobs and freshness." },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_45%),radial-gradient(circle_at_20%_40%,_rgba(14,165,233,0.35),_transparent_35%),radial-gradient(circle_at_80%_10%,_rgba(168,85,247,0.25),_transparent_30%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary">ClawPilot - OpenClaw + CopilotKit</Badge>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              OpenClaw mission control for Wordware Hack Night
            </h1>
            <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
              Kick off runs, monitor tool approvals, sync Canvas widgets, and emit AG-UI events for your demo. Deep
              links available via openclaw://agent?message=...
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => startRun([{ role: "user", content: prompt }])} disabled={loading}>
              Quick Start
            </Button>
            <Button
              variant="default"
              className="shadow-lg shadow-blue-500/30"
              onClick={() => startRun([{ role: "user", content: prompt }])}
              disabled={loading}
            >
              {loading ? "Launching..." : "Launch Run"}
            </Button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <div className="border-b border-white/10 p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm text-slate-300">Active Run</p>
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <span>{run?.id ?? "No run started"}</span>
                    <Badge variant={statusTone.badge}>{statusTone.label}</Badge>
                  </div>
                </div>
                <div className="text-right text-sm text-slate-400">
                  {run?.status ? `Status: ${run.status}` : "Waiting for a run"}
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] w-full rounded-xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-50 shadow-inner focus:border-blue-400 focus:outline-none"
                placeholder="triage inbox"
              />
              {error && <p className="text-sm text-amber-300">Warning: {error}</p>}
              <div className="flex flex-wrap gap-3">
                <Button variant="default" size="lg" onClick={() => startRun([{ role: "user", content: prompt }])} disabled={loading}>
                  {loading ? "Running..." : isRunning ? "Re-run" : "Start"}
                </Button>
                <Button variant="secondary" size="lg" onClick={() => setPrompt("triage inbox")}>
                  Reset
                </Button>
              </div>
              <div className="rounded-xl border border-white/10 bg-background/60 p-4 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Run</span>
                  <span className="text-slate-400">{run?.id || "none"}</span>
                </div>
                <div className="mt-2 text-slate-400">
                  Status: {run?.status || "idle"} | Tools waiting: {pendingTools.length}
                </div>
              </div>
              <TaskCard
                title="OpenClaw Task"
                subtitle="Live AG-UI stream"
                description={prompt}
                run={run}
                tool={activeTool}
                status={run?.status}
                onApprove={(runId, toolId, approved) => approveTool(toolId, approved ? "approve" : "reject")}
              />
            </div>
          </Card>

          <Card className="lg:col-span-1 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Live Telemetry</h2>
              <Badge variant={statusTone.badge}>{statusTone.label}</Badge>
            </div>
            <div className="space-y-3">
              <Stat label="Status" value={run?.status ?? "idle"} />
              <Stat label="Output" value={run?.output ?? "-"} />
              <Stat label="Tools waiting" value={pendingTools.length} />
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Approvals</p>
              {pendingTools.length === 0 ? (
                <p className="text-sm text-slate-300">No tools awaiting approval.</p>
              ) : (
                <div className="space-y-3">
                  {pendingTools.map((tool) => (
                    <div key={tool.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-semibold">{tool.name ?? "Tool"}</p>
                          <p className="text-slate-400">{tool.reason ?? "Requires approval"}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="md"
                            onClick={() => approveTool(tool.id, "reject")}
                            disabled={loading}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="default"
                            size="md"
                            onClick={() => approveTool(tool.id, "approve")}
                            disabled={loading}
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                if (emitAg && (run || pendingTools.length)) {
                  emitAg("surfaceUpdate", { snapshot: { run, pendingTools }, status: "snapshot" });
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
            >
              Capture snapshot to Canvas
            </button>
            <div className="text-xs text-slate-400">
              Deep link:{" "}
              <a className="text-blue-300" href="openclaw://agent?message=triage%20inbox">
                openclaw://agent?message=triage inbox
              </a>
            </div>
          </Card>

          <Card className="lg:col-span-1 p-6">
            <SkillsPanel />
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Card key={task.title} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold">{task.title}</h3>
                  <p className="text-sm text-slate-300">{task.desc}</p>
                </div>
                <Badge variant="outline">Queued</Badge>
              </div>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}

const Stat = ({ label, value }) => (
  <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3">
    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
    <p className="text-sm font-semibold text-slate-50 break-words">{String(value ?? "-")}</p>
  </div>
);

const PlaceholderItem = ({ label }) => (
  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
    <span>{label}</span>
    <span className="text-xs text-slate-500">Coming soon</span>
  </div>
);
