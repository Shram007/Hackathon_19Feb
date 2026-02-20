"use client";

import { useEffect, useMemo } from "react";
import { AgentTask } from "@contextableai/clawg-ui";
import { useAgUI } from "ag-ui";

export function TaskCard({
  title = "OpenClaw Task",
  subtitle = "Live agent task",
  description = "",
  run,
  tool,
  status,
  onApprove,
}) {
  const { emit } = useAgUI?.() || { emit: null };

  const currentStatus = useMemo(() => status || run?.status || "idle", [run?.status, status]);

  useEffect(() => {
    if (!emit || !run?.id) return;
    emit({ type: "statusUpdate", payload: { id: run.id, status: run.status } });
  }, [emit, run?.id, run?.status]);

  useEffect(() => {
    if (!emit || !tool) return;
    const state = tool.status || tool.state || "pending";
    emit({
      type: "toolCall",
      payload: { runId: run?.id, toolId: tool.id, status: state, name: tool.name },
    });
  }, [emit, run?.id, tool]);

  const handleApprove = (approved) => {
    if (emit && tool?.id) {
      emit({
        type: "humanInput",
        payload: { runId: run?.id, toolId: tool.id, action: approved ? "approve" : "reject" },
      });
    }
    if (onApprove && tool?.id && run?.id) {
      onApprove(run.id, tool.id, approved);
    }
  };

  const handleHover = () => {
    if (emit && tool) {
      emit({ type: "contextEnrich", payload: { runId: run?.id, tool } });
    }
  };

  return (
    <div onMouseEnter={handleHover}>
      <AgentTask
        title={title}
        subtitle={subtitle}
        description={description}
        status={currentStatus}
        tool={tool}
        onApprove={() => handleApprove(true)}
        onReject={() => handleApprove(false)}
      />
    </div>
  );
}
