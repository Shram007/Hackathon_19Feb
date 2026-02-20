import { useState } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { AgUIProvider } from "ag-ui";
import { Play, Radio } from "lucide-react";
import { useOpenClaw } from "./hooks/useOpenClaw";
import { ClawgUISetup } from "./components/clawg-ui-setup";
import { TaskCard } from "./components/TaskCard";
import { ApprovalModal } from "./components/ApprovalModal";
import { ErrorBoundaryWithAgUI } from "./components/ErrorBoundary";

const Button = ({ children, onClick, variant = "primary", disabled }) => {
  const base =
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const variants = {
    primary:
      "bg-primary text-white shadow-glow hover:brightness-110 focus-visible:outline-primary disabled:opacity-60 disabled:cursor-not-allowed",
    ghost:
      "bg-transparent text-foreground border border-border hover:bg-white/5 focus-visible:outline-border disabled:opacity-60 disabled:cursor-not-allowed",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
};

function CanvasHost() {
  return (
    <div
      id="openclaw-canvas"
      data-a2ui-host="openclaw"
      className="mt-6 min-h-[320px] w-full rounded-2xl border border-border bg-card/60 backdrop-blur"
    >
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        OpenClaw Canvas (A2UI host)
      </div>
    </div>
  );
}

export default function App() {
  const [prompt, setPrompt] = useState("triage inbox");
  const { run, startRun, pendingTools, activeTool, loading, isRunning, approveTool } = useOpenClaw();

  return (
    <AgUIProvider>
      <CopilotKit>
        <ClawgUISetup>
          <ErrorBoundaryWithAgUI>
          <div className="min-h-screen bg-background text-foreground">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.25),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.2),transparent_30%)]" />
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Wordfare Hack Night</p>
                <h1 className="text-4xl font-bold text-white">ClawPilot Mission Control</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  AG-UI powered CopilotKit surface for OpenClaw Canvas A2UI. Kick off runs, stream status updates, and
                  approve tools in one place.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => startRun([{ role: "user", content: prompt }])} disabled={loading}>
                  <Radio size={16} />
                  Quick start
                </Button>
                <Button onClick={() => startRun([{ role: "user", content: prompt }])} disabled={loading}>
                  <Play size={16} />
                  {loading ? "Launching..." : "Launch run"}
                </Button>
              </div>
            </header>

            <main className="grid gap-6 lg:grid-cols-5">
              <section className="lg:col-span-3 rounded-2xl border border-border bg-card/80 p-6 shadow-glow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Prompt</p>
                    <h2 className="text-lg font-semibold text-white">Run setup</h2>
                  </div>
                  <span className="text-xs text-slate-400">
                    {isRunning ? "Running" : run?.status ? run.status : "Idle"}
                  </span>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="mt-4 h-32 w-full rounded-xl border border-border bg-background p-4 text-sm text-foreground focus:border-primary focus:outline-none"
                  placeholder="triage inbox"
                />
                <div className="mt-3 flex gap-3">
                  <Button onClick={() => startRun([{ role: "user", content: prompt }])} disabled={loading}>
                    <Play size={16} />
                    {loading ? "Launching..." : "Start"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setPrompt("triage inbox")}
                    disabled={loading}
                  >
                    Reset
                  </Button>
                </div>
                <div className="mt-4 rounded-xl border border-border bg-background/60 p-4 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Run</span>
                    <span className="text-slate-400">{run?.id || "none"}</span>
                  </div>
                  <div className="mt-2 text-slate-400">
                    Status: {run?.status || "idle"} | Tools waiting: {pendingTools.length}
                  </div>
                </div>
                <div className="mt-4">
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
              </section>

              <section className="lg:col-span-2 rounded-2xl border border-border bg-card/80 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Copilot</h2>
                  <span className="text-xs text-slate-400">CopilotKit + AG-UI</span>
                </div>
                <CanvasHost />
                <div className="mt-4">
                  <ApprovalModal
                    open={Boolean(activeTool)}
                    run={run}
                    tool={activeTool}
                    onApprove={(runId, toolId, approved, payload) =>
                      approveTool(toolId, approved ? "approve" : "reject", payload)
                    }
                  />
                </div>
              </section>
            </main>
          </div>
          <CopilotSidebar defaultOpen labels={{ title: "ClawPilot", initial: "Ask ClawPilot to triage inbox." }} />
          </div>
          </ErrorBoundaryWithAgUI>
        </ClawgUISetup>
      </CopilotKit>
    </AgUIProvider>
  );
}
