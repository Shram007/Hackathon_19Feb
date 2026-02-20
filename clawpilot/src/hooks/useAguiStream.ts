import { useState, useEffect } from 'react';
import { HttpAgent } from '@ag-ui/client';
import { useCopilotChat, useCopilotAction } from '@copilotkit/react-core';

const VITE_CLAWG_UI_URL = import.meta.env.VITE_CLAWG_UI_URL;
const VITE_CLAWG_UI_DEVICE_TOKEN = import.meta.env.VITE_CLAWG_UI_DEVICE_TOKEN;

interface Run {
  runId: string;
  threadId: string;
  status: 'running' | 'finished' | 'error';
  steps: any[];
  messages: string[];
  startedAt: number;
  finishedAt?: number;
  error?: string;
}

interface PendingToolCall {
  toolCallId: string;
  toolCallName: string;
  args: string;
  runId: string;
}

export const useAguiStream = () => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [pendingToolCalls, setPendingToolCalls] = useState<PendingToolCall[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const { sendMessage } = useCopilotChat();

  const riskyToolNames = ['shell', 'exec', 'email', 'send', 'delete', 'write'];

  riskyToolNames.forEach(toolName => {
    useCopilotAction({
      name: toolName,
      handler: async (args) => {
        return new Promise((resolve, reject) => {
          const toolCallId = `tool_${Date.now()}`;
          const newToolCall = {
            toolCallId,
            toolCallName: toolName,
            args: JSON.stringify(args),
            runId: 'unknown', // This will be updated when the run is found
          };
          setPendingToolCalls(prev => [...prev, newToolCall]);
        });
      },
    });
  });


  useEffect(() => {
    const agent = new HttpAgent({
      url: VITE_CLAWG_UI_URL,
      headers: { Authorization: `Bearer ${VITE_CLAWG_UI_DEVICE_TOKEN}` },
    });

    const stream = agent.run({
      threadId: 'main',
      messages: [{ role: 'user', content: 'heartbeat' }],
    });

    (async () => {
      for await (const event of stream) {
        setRuns(prevRuns => {
          let newRuns = [...prevRuns];
          let runIndex = newRuns.findIndex(r => r.runId === event.runId);

          if (runIndex === -1 && (event.type === 'RUN_STARTED' || event.runId)) {
            newRuns.unshift({ runId: event.runId, threadId: event.threadId, status: 'running', steps: [], messages: [], startedAt: Date.now() });
            runIndex = 0;
          }

          if (runIndex !== -1) {
            const currentRun = { ...newRuns[runIndex] };
            switch (event.type) {
              case 'RUN_STARTED':
                currentRun.status = 'running';
                break;
              case 'TEXT_MESSAGE_CONTENT':
                currentRun.messages.push(event.delta);
                break;
              case 'STEP_STARTED':
                currentRun.steps.push({ name: event.stepName, duration: '' });
                break;
              case 'STEP_FINISHED': {
                const lastStep = currentRun.steps[currentRun.steps.length - 1];
                if (lastStep && lastStep.name === event.stepName) {
                  // This is a simplification; duration would ideally be calculated
                  lastStep.duration = 'completed';
                }
                break;
              }
              case 'RUN_FINISHED':
                currentRun.status = 'finished';
                currentRun.finishedAt = Date.now();
                break;
              case 'RUN_ERROR':
                currentRun.status = 'error';
                currentRun.error = event.message;
                currentRun.finishedAt = Date.now();
                break;
            }
            newRuns[runIndex] = currentRun;
          }

          return newRuns;
        });
      }
    })();
  }, []);

  const approveTool = (toolCallId: string, result: string) => {
    // This is a placeholder. The actual implementation requires resolving the promise from useCopilotAction.
    setPendingToolCalls(prev => prev.filter(tc => tc.toolCallId !== toolCallId));
  };

  const rejectTool = (toolCallId: string, reason: string) => {
    // This is a placeholder. The actual implementation requires rejecting the promise from useCopilotAction.
    setPendingToolCalls(prev => prev.filter(tc => tc.toolCallId !== toolCallId));
  };


  return { runs, pendingToolCalls, isRunning, sendMessage, approveTool, rejectTool };
};