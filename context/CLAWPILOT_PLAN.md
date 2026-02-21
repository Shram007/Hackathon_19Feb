# ClawPilot — Coding Agent Mission Brief

## Context Files (read all of these before writing any code)
- `context/AGUI_CONTEXT.md`              — AG-UI event protocol, all event types, CopilotKit hooks
- `context/OPENCLAW_CONTEXT.md`          — OpenClaw Gateway, WebSocket API, sessions, skills, cron
- `context/CLAWGUI_CONTEXT.md`           — clawg-ui plugin, /v1/clawg-ui endpoint, device pairing auth
- `context/OPENCLAW_CANVAS_A2UI_CONTEXT.md` — Canvas panel, A2UI v0.8, iframe integration pattern

---

## What You Are Building

ClawPilot is a React + TypeScript browser dashboard that sits on top of an OpenClaw
Gateway. It is a pure UI layer — it does NOT implement any agent logic.

It connects to OpenClaw via the clawg-ui plugin which exposes an AG-UI-compatible
SSE endpoint at `POST http://localhost:18789/v1/clawg-ui`.

The React app uses CopilotKit as its AG-UI client. All agent events (text streaming,
tool calls, run lifecycle) arrive as AG-UI SSE events from clawg-ui.

```
[ ClawPilot React App ]   ← you are building this
         ↕  AG-UI SSE (CopilotKit + clawg-ui)
[ OpenClaw Gateway :18789 ]
         ↕
[ Pi Agent + Tools ]
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| AG-UI client | `@copilotkit/react-core`, `@copilotkit/react-ui`, `@ag-ui/client` |
| Gateway bridge | clawg-ui → `http://localhost:18789/v1/clawg-ui` |
| Styling | Tailwind CSS |
| State | React hooks only (no Redux) |
| Build | Vite |

---

## Environment Variables

```env
VITE_CLAWG_UI_URL=http://localhost:18789/v1/clawg-ui
VITE_CLAWG_UI_DEVICE_TOKEN=<device_token_from_pairing>
VITE_GATEWAY_WS_URL=ws://localhost:18789
```

---

## Project File Structure

```
clawpilot/
├── context/
│   ├── AGUI_CONTEXT.md
│   ├── OPENCLAW_CONTEXT.md
│   ├── CLAWGUI_CONTEXT.md
│   └── OPENCLAW_CANVAS_A2UI_CONTEXT.md
├── src/
│   ├── main.tsx                        ← Vite entry, wraps App in CopilotKit
│   ├── App.tsx                         ← Root layout: sidebar nav + panel router
│   ├── env.ts                          ← Typed env var exports
│   │
│   ├── lib/
│   │   └── gatewayClient.ts            ← Raw WebSocket client for OpenClaw WS API
│   │
│   ├── hooks/
│   │   ├── useAguiStream.ts            ← Subscribes to AG-UI SSE via HttpAgent,
│   │   │                                  exposes { runs, pendingToolCalls, isRunning }
│   │   ├── useGatewayWs.ts             ← WebSocket hook for chat.send / skills.* / cron.*
│   │   └── useDevicePairing.ts         ← Handles clawg-ui pairing flow on first launch
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx             ← Nav links: Tasks | Approvals | Skills | Canvas
│   │   │   └── StatusBar.tsx           ← Gateway connection indicator (connected/disconnected)
│   │   │
│   │   ├── TaskList.tsx                ← Live runs view driven by AG-UI lifecycle events
│   │   │                                  Consumes: RUN_STARTED, STEP_STARTED/FINISHED,
│   │   │                                           TEXT_MESSAGE_CONTENT, RUN_FINISHED, RUN_ERROR
│   │   │
│   │   ├── ApprovalPanel.tsx           ← HITL approval UI
│   │   │                                  Consumes: TOOL_CALL_START events (filtered for risky tools)
│   │   │                                  Actions: approve → send result; reject → send rejection
│   │   │
│   │   ├── SkillsPanel.tsx             ← Skills list + toggle + manual trigger
│   │   │                                  Uses: skills.* WS namespace via useGatewayWs
│   │   │
│   │   ├── CanvasPanel.tsx             ← Optional A2UI iframe panel
│   │   │                                  Renders: <iframe src="/__openclaw__/a2ui/" />
│   │   │                                  Shown only if gateway has Canvas host advertised
│   │   │
│   │   └── PairingModal.tsx            ← First-launch device pairing flow
│   │                                      Shows pairingCode, polls for approval
│   │
│   └── types/
│       └── index.ts                    ← Shared TypeScript types for runs, tool calls, skills
│
├── .env
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Component Specifications

### `src/main.tsx`
Wrap entire app in `<CopilotKit>`:
```tsx
import { CopilotKit } from "@copilotkit/react-core";

const deviceToken = import.meta.env.VITE_CLAWG_UI_DEVICE_TOKEN;

createRoot(document.getElementById("root")!).render(
  <CopilotKit
    runtimeUrl={import.meta.env.VITE_CLAWG_UI_URL}
    headers={{ Authorization: `Bearer ${deviceToken}` }}
  >
    <App />
  </CopilotKit>
);
```

---

### `src/hooks/useDevicePairing.ts`
Handles first-launch auth:
- On mount, check localStorage for existing `clawpilot_device_token`
- If none: POST to `/v1/clawg-ui` with no auth header
- Parse 403 `pairing_pending` response → extract `pairingCode` and `token`
- Store `token` in localStorage as `clawpilot_device_token`
- Expose `{ isPairing, pairingCode, isApproved }` to trigger `PairingModal`
- Poll `/v1/clawg-ui` with the token every 3s until 200 (approved) or keep showing modal
- Once approved, set `isApproved = true` → app proceeds normally

---

### `src/hooks/useAguiStream.ts`
Subscribes to AG-UI events and transforms them into app state:

```ts
interface Run {
  runId:     string
  threadId:  string
  status:    "running" | "finished" | "error"
  steps:     Step[]
  messages:  string[]   // accumulated TEXT_MESSAGE_CONTENT deltas
  startedAt: number
  finishedAt?: number
  error?: string
}

interface PendingToolCall {
  toolCallId:   string
  toolCallName: string
  args:         string  // accumulated TOOL_CALL_ARGS deltas
  runId:        string
}

// Hook returns:
{
  runs:             Run[]
  pendingToolCalls: PendingToolCall[]
  isRunning:        boolean
  sendMessage:      (content: string, threadId?: string) => void
  approveTool:      (toolCallId: string, result: string) => void
  rejectTool:       (toolCallId: string, reason: string) => void
}
```

Implementation notes:
- Use `useCopilotChat()` from `@copilotkit/react-core` for sendMessage
- Use `useCopilotAction()` to register handlers for risky tools:
  - Risky tool names: any containing `shell`, `exec`, `email`, `send`, `delete`, `write`
  - On intercept: push to `pendingToolCalls` state, pause and wait for user action
  - `approveTool` → call the action's `resolve(result)`
  - `rejectTool` → call the action's `reject(reason)`
- Manually subscribe to raw AG-UI events via `HttpAgent` from `@ag-ui/client`
  for `RUN_STARTED`, `RUN_FINISHED`, `RUN_ERROR`, `STEP_STARTED`, `STEP_FINISHED`
  to build the `runs` array

---

### `src/components/TaskList.tsx`
Displays all agent runs in reverse-chronological order:

Data consumed: `runs` array from `useAguiStream`

Each run card shows:
- Status badge: `running` (pulsing dot) | `finished` (green) | `error` (red)
- Run ID (truncated) + started timestamp
- Steps as a timeline: each `Step` with name + duration
- Streamed message preview (last 200 chars of accumulated text)
- Expand/collapse for full message

No direct API calls — purely driven by AG-UI event state.

---

### `src/components/ApprovalPanel.tsx`
Human-in-the-loop approval UI:

Data consumed: `pendingToolCalls` from `useAguiStream`

For each pending tool call, render a card showing:
- Tool name (highlighted in red if risky: shell/exec/email/delete)
- Accumulated args (formatted as JSON code block)
- Two buttons: **Approve** and **Reject**
- On Approve: call `approveTool(toolCallId, "approved")`
- On Reject: call `rejectTool(toolCallId, "rejected by user")`
- Show empty state when no pending approvals: "No pending approvals"

Show a red badge count on the Sidebar nav item when `pendingToolCalls.length > 0`.

---

### `src/components/SkillsPanel.tsx`
Skills management:

Data consumed: `skills.list` response from `useGatewayWs`

On mount: send `{ type: "skills.list" }` over WebSocket → receive skills array.

Each skill card shows:
- Skill name + description
- Enabled/disabled toggle → sends `{ type: "skills.enable" | "skills.disable", skill: name }`
- "Run Now" button → sends `{ type: "chat.send", message: "Run skill: <name>" }`

Hardcode 2-3 preset trigger buttons for demo:
- "Daily Summary" → `chat.send` with message "Generate a daily summary"
- "Code Review" → `chat.send` with message "Review my latest code changes"

---

### `src/components/CanvasPanel.tsx`
Optional A2UI viewer:

```tsx
const [available, setAvailable] = useState(false);

useEffect(() => {
  fetch("http://localhost:18789/__openclaw__/a2ui/", { method: "HEAD" })
    .then(r => { if (r.ok) setAvailable(true); })
    .catch(() => setAvailable(false));
}, []);

if (!available) return <div>Canvas not available (macOS only)</div>;

return (
  <iframe
    src="http://localhost:18789/__openclaw__/a2ui/"
    style={{ width: "100%", height: "100%", border: "none" }}
    title="OpenClaw Canvas"
  />
);
```

No A2UI rendering reimplemented in React — the iframe handles everything.

---

### `src/lib/gatewayClient.ts`
Raw WebSocket wrapper for OpenClaw Gateway WS API:

```ts
class GatewayClient {
  private ws: WebSocket;

  constructor(url: string, token: string) {
    this.ws = new WebSocket(`${url}?auth.token=${token}`);
  }

  send(type: string, payload: object): void
  on(type: string, handler: (data: any) => void): void
  off(type: string, handler: (data: any) => void): void
  close(): void
}
```

Used by `useGatewayWs` hook — not used directly by components.

---

## Scope

### IN SCOPE (build these)
- Device pairing flow on first launch (`PairingModal` + `useDevicePairing`)
- Live task/runs list driven by AG-UI events (`TaskList`)
- HITL approval panel for risky tool calls (`ApprovalPanel`)
- Skills list + toggle + 2-3 hardcoded trigger presets (`SkillsPanel`)
- Canvas iframe panel with availability check (`CanvasPanel`)
- Gateway connection status indicator (`StatusBar`)
- Error states: Gateway offline, pairing failed, RUN_ERROR

### OUT OF SCOPE (do not build)
- Cron job management UI
- Config editor
- Log viewer
- Multi-session switching
- Mobile/responsive layout
- Full CopilotKit chat sidebar (use raw AG-UI stream only)
- Custom A2UI renderer in React
- User authentication beyond device pairing

---

## Build Order (5 Hours)

### Hour 1 — Scaffold + Pairing + Mock Data
1. `npm create vite@latest clawpilot -- --template react-ts`
2. `npm install @ag-ui/client @copilotkit/react-core @copilotkit/react-ui tailwindcss`
3. Create `.env` with placeholder token
4. Implement `useDevicePairing` with localStorage check
5. Build `PairingModal` — shows pairingCode, polls for approval
6. Wrap `main.tsx` in `<CopilotKit>`
7. Build `App.tsx` skeleton with sidebar + panel router
8. Build `TaskList` with **hardcoded mock runs** (3 mock runs: 1 running, 1 finished, 1 error)

Verify: App loads, pairing modal shows if no token, mock task list renders.

### Hour 2 — Wire Real AG-UI Stream + TaskList
1. Implement `useAguiStream` — subscribe to real AG-UI SSE via `HttpAgent`
2. Handle `RUN_STARTED` → add run to state
3. Handle `TEXT_MESSAGE_CONTENT` → accumulate delta per runId
4. Handle `STEP_STARTED/FINISHED` → update steps array
5. Handle `RUN_FINISHED` / `RUN_ERROR` → finalize run status
6. Replace mock data in `TaskList` with live `runs` state
7. Add `StatusBar` with WebSocket connection indicator

Verify: Trigger a message in OpenClaw Control UI → ClawPilot TaskList updates in real-time.

### Hour 3 — Approvals Flow End-to-End
1. Register `useCopilotAction` handlers for risky tool names
2. On intercept: push `PendingToolCall` to state, surface in `ApprovalPanel`
3. Wire Approve button → `approveTool(toolCallId, "approved")`
4. Wire Reject button → `rejectTool(toolCallId, "rejected by user")`
5. Add red badge count on Sidebar when approvals pending
6. Test end-to-end: prompt agent with a shell command → approval card appears → approve → agent continues

Verify: Agent pauses on risky tool → UI shows approval card → approve → agent resumes.

### Hour 4 — Skills Panel + Canvas Panel
1. Implement `useGatewayWs` WebSocket hook
2. On mount: fetch `skills.list`, render `SkillsPanel`
3. Wire enable/disable toggles
4.
