# OpenClaw Gateway — Agent Context File 
 
 **Docs home:** `https://docs.openclaw.ai/`  
 **Features:** `https://docs.openclaw.ai/concepts/features`  
 **Control UI:** `https://docs.openclaw.ai/web/control-ui`  
 **Getting Started:** `https://docs.openclaw.ai/start/getting-started`  
 
 --- 
 
 ## What OpenClaw Is 
 
 OpenClaw is a self-hosted, MIT-licensed Node.js 22+ gateway that bridges AI coding agents 
 to messaging channels and exposes a WebSocket + HTTP API for custom UIs. 
 
 For ClawPilot: OpenClaw is the agent runtime backend. ClawPilot is a browser UI layer on 
 top of it. ClawPilot does NOT reimplement any agent logic — it reads from and writes to 
 the OpenClaw Gateway only. 
 
 --- 
 
 ## Quick Install 
 
 ```bash 
 npm install -g openclaw@latest 
 openclaw onboard --install-daemon   # guided setup 
 openclaw channels login             # pair messaging channels 
 openclaw gateway --port 18789       # start gateway (default port 18789) 
 ``` 
 
 Config: `~/.openclaw/openclaw.json` 
 Dashboard: `http://127.0.0.1:18789/` 
 
 --- 
 
 ## Full Architecture 
 
 ``` 
 Messaging Channels 
   WhatsApp (Baileys) · Telegram (grammY) · Discord · iMessage · Mattermost (plugin) 
                               ↕ 
                   [ OpenClaw Gateway ]        ← Node.js, port 18789 
            Sessions · Routing · Auth · Tools 
                               ↕ 
                [ Pi Agent — RPC mode ]        ← ONLY supported agent path 
                               ↕ 
              [ Tools: shell, email, etc. ] 
 ``` 
 
 IMPORTANT: Pi is the ONLY supported coding agent. 
 Legacy Claude, Codex, Gemini, and Opencode paths have been removed. 
 
 --- 
 
 ## Gateway WebSocket API 
 
 WebSocket endpoint: `ws://localhost:18789` 
 
 ### Authentication 
 
 - Local `127.0.0.1` → auto-approved, no token needed 
 - Remote connections → one-time device pairing required: 
 
 ```bash 
 openclaw devices list 
 openclaw devices approve <requestId> 
 ``` 
 
 WS connect params: 
 - `connect.params.auth.token` — persistent token (stored in Control UI settings) 
 - `connect.params.auth.password` — in-memory only, not persisted 
 
 ### WebSocket Namespaces 
 
 | Namespace | What it controls | 
 |---|---| 
 | `chat.send` | Send message to agent — NON-BLOCKING, acks with `{ runId, status: "started" }` | 
 | `chat.history` | Fetch conversation history (size-bounded, large messages truncated) | 
 | `chat.abort` | Abort active run — `{ sessionKey }` stops ALL runs in that session | 
 | `chat.inject` | Append assistant note to transcript without triggering agent run | 
 | `cron.list` | List all cron jobs | 
 | `cron.add` | Add new cron job | 
 | `cron.run` | Manually trigger a cron job | 
 | `cron.enable` / `cron.disable` | Toggle cron jobs | 
 | `skills.list` | List skills with status | 
 | `skills.enable` / `skills.disable` | Toggle skills | 
 | `skills.install` | Install a skill | 
 | `sessions.list` | List all sessions | 
 | `sessions.patch` | Override thinking/verbose per session | 
 | `exec.approvals.*` | Edit exec allowlists + approval policy per node | 
 | `channels.status` | Channel connection status | 
 | `config.get` / `config.set` | Read/write `openclaw.json` live | 
 | `config.apply` | Apply config changes + restart with validation | 
 | `node.list` | List connected nodes with capabilities | 
 | `logs.tail` | Live gateway log stream with filter/export | 
 | `system-presence` | Instance presence list | 
 | `update.run` | Package update + restart | 
 
 ### chat.send Detailed Behavior 
 
 ```json 
 // Request 
 { "type": "chat.send", "message": "Do X", "idempotencyKey": "abc123" } 
 
 // Immediate ack (non-blocking) 
 { "runId": "run-xyz", "status": "started" } 
 
 // Re-send same idempotencyKey while in-flight 
 { "status": "in_flight" } 
 
 // Re-send same idempotencyKey after complete 
 { "status": "ok" } 
 ``` 
 
 Response streams as `chat` events — tool calls + text in real-time over WebSocket. 
 
 --- 
 
 ## Skills 
 
 Named agent capabilities that can be toggled: 
 - Managed via `skills.*` WS commands or Control UI Skills panel 
 - Each skill may require an API key configured via `skills.*` 
 - Can be triggered manually from UI or by cron 
 
 --- 
 
 ## Cron Jobs 
 
 Recurring scheduled agent runs: 
 
 | Field | Values | 
 |---|---| 
 | Delivery mode | `announce` (post to channel), `none` (internal only), `webhook` (HTTP POST) | 
 | `delivery.to` | Target channel or webhook URL | 
 | `cron.webhookToken` | Optional Bearer token sent with webhook requests | 
 
 Commands: `cron.add`, `cron.list`, `cron.run`, `cron.enable`, `cron.disable` 
 
 --- 
 
 ## Exec Approvals 
 
 Controls which shell commands require human confirmation before execution: 
 - `exec.approvals.*` WS namespace 
 - Edit allowlists per node (gateway node or mobile node) 
 - Approval policy: which exec calls pause for HITL confirmation 
 
 --- 
 
 ## Sessions 
 
 - Direct chats → collapse into shared `main` session 
 - Group chats → isolated session per group 
 - `sessions.list` → list all active sessions 
 - `sessions.patch` → per-session overrides (thinking mode, verbose, etc.) 
 
 --- 
 
 ## Nodes (iOS / Android / macOS) 
 
 Paired mobile/desktop nodes extend the gateway: 
 - `node.list` → list connected nodes with capability flags 
 - Canvas commands (macOS/iOS/Android): see OPENCLAW_CANVAS_A2UI_CONTEXT.md 
 
 --- 
 
 ## Control UI (Built-in Dashboard) 
 
 Vite + Lit SPA served at `http://<host>:18789/` 
 - Speaks directly to Gateway WebSocket on same port 
 - Full config editor, live log tail, session manager, cron/skills panels 
 - Dev mode: `pnpm ui:dev` + `?gatewayUrl=ws://<host>:18789&token=<tok>` 
 
 ClawPilot is a SEPARATE purpose-built UI. It does not replace the Control UI. 
 
 --- 
 
 ## Remote Access 
 
 ```bash 
 # Recommended — HTTPS via Tailscale Serve 
 openclaw gateway --tailscale serve 
 
 # Bind to tailnet with manual token 
 openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)" 
 ``` 
 
 Allow custom origins for CORS (dev): 
 ```json 
 { "gateway": { "controlUi": { "allowedOrigins": ["http://localhost:5173"] } } } 
 ``` 
 
 --- 
 
 ## Minimal Config Example 
 
 ```json 
 { 
   "channels": { 
     "whatsapp": { 
       "allowFrom": ["+15555550123"], 
       "groups": { "*": { "requireMention": true } } 
     } 
   }, 
   "messages": { 
     "groupChat": { "mentionPatterns": ["@openclaw"] } 
   } 
 } 
 ``` 
 
 --- 
 
 ## What ClawPilot Reads from OpenClaw 
 
 | ClawPilot Feature | OpenClaw API used | 
 |---|---| 
 | Live task/runs list | AG-UI SSE stream via clawg-ui `/v1/clawg-ui` | 
 | HITL tool approvals | AG-UI TOOL_CALL events via clawg-ui, respond via same stream | 
 | Skills panel | `skills.*`