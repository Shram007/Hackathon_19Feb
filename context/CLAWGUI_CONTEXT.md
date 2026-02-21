# clawg-ui — Agent Context File 
 
 **Repo:** `https://github.com/contextablemark/clawg-ui`  
 **npm:** @contextableai/clawg-ui 
 **Latest release:** v0.2.7 
 **Language:** TypeScript (100%) 
 **License:** MIT 
 
 --- 
 
 ## What clawg-ui Is 
 
 clawg-ui is an OpenClaw **channel plugin** that exposes the OpenClaw Gateway as an 
 AG-UI protocol-compatible HTTP endpoint. It is the bridge between OpenClaw and any 
 AG-UI client (CopilotKit, @ag-ui/client HttpAgent, curl, etc.). 
 
 Without clawg-ui, OpenClaw has no AG-UI endpoint. With it, your React app can talk 
 to OpenClaw using standard AG-UI SSE streams. 
 
 --- 
 
 ## Install 
 
 ```bash 
 # Via npm 
 npm install @contextableai/clawg-ui 
 
 # Via OpenClaw plugin CLI (preferred) 
 openclaw plugins install @contextableai/clawg-ui 
 ``` 
 
 Then restart the gateway. The plugin auto-registers: 
 - HTTP route: `POST /v1/clawg-ui` 
 - Channel name: `clawg-ui` 
 
 --- 
 
 ## How It Works (Full Flow) 
 
 ``` 
 AG-UI Client                    OpenClaw Gateway 
      |                                  | 
      |  POST /v1/clawg-ui               | 
      |  RunAgentInput JSON              | 
      |--------------------------------->| 
      |                                  | 1. Authenticate (device token) 
      |                                  | 2. Parse AG-UI messages → inbound context 
      |                                  | 3. Route to agent via standard routing 
      |                                  | 4. Dispatch through reply pipeline 
      |                                  |    (same path as Telegram, Discord, etc.) 
      |  SSE: RUN_STARTED                | 
      |<---------------------------------| 
      |  SSE: TEXT_MESSAGE_START         | 
      |<---------------------------------| 
      |  SSE: TEXT_MESSAGE_CONTENT (×N)  | 
      |<---------------------------------| 
      |  SSE: TOOL_CALL_START            | 
      |<---------------------------------| (if agent uses tools) 
      |  SSE: TOOL_CALL_END              | 
      |<---------------------------------| 
      |  SSE: TEXT_MESSAGE_END           | 
      |<---------------------------------| 
      |  SSE: RUN_FINISHED               | 
      |<---------------------------------| 
 ``` 
 
 --- 
 
 ## Endpoint 
 
 ``` 
 POST http://localhost:18789/v1/clawg-ui 
 Content-Type: application/json 
 Accept: text/event-stream 
 Authorization: Bearer <device_token> 
 ``` 
 
 ### Request Body — RunAgentInput 
 
 | Field | Type | Required | Notes | 
 |---|---|---|---| 
 | `threadId` | string | no | Auto-generated if omitted | 
 | `runId` | string | no | Auto-generated if omitted | 
 | `messages` | Message[] | **yes** | At least one `user` message required | 
 | `tools` | Tool[] | no | Reserved for future use | 
 | `state` | object | no | Reserved for future use | 
 
 Message format: 
 ```json 
 { "role": "user", "content": "Hello" } 
 ``` 
 Supported roles: `user`, `assistant`, `system`, `tool` 
 
 ### Response — SSE Stream of AG-UI Events 
 
 | Event type | When emitted | 
 |---|---| 
 | `RUN_STARTED` | Immediately after auth + validation | 
 | `TEXT_MESSAGE_START` | First assistant text chunk arriving | 
 | `TEXT_MESSAGE_CONTENT` | Each streamed text delta | 
 | `TEXT_MESSAGE_END` | After last text chunk | 
 | `TOOL_CALL_START` | Agent invokes a tool | 
 | `TOOL_CALL_END` | Tool execution complete | 
 | `RUN_FINISHED` | Agent run complete | 
 | `RUN_ERROR` | On any failure — stream closes | 
 
 Each SSE line is: `data: <JSON with "type" field>\n\n` 
 
 --- 
 
 ## Agent Routing 
 
 Default: routes to `main` agent. 
 
 To target a specific agent: 
 ```bash 
 curl ... -H "X-OpenClaw-Agent-Id: my-agent" 
 ``` 
 
 --- 
 
 ## Authentication — Device Pairing (Required) 
 
 clawg-ui uses **device pairing** for per-device access control. 
 The old approach of using the gateway master token directly is **deprecated and no longer supported**. 
 
 ### Pairing Flow 
 
 ``` 
 Client                  Gateway                 Gateway Owner 
   |                        |                         | 
   | POST /v1/clawg-ui      |                         | 
   | (no auth header)       |                         | 
   |----------------------->|                         | 
   |                        |                         | 
   | 403 pairing_pending    |                         | 
   | { pairingCode,         |                         | 
   |   token }              |                         | 
   |<-----------------------|                         | 
   |                        |                         | 
   |  share pairingCode out-of-band ----------------->| 
   |                        |                         | 
   |                        | openclaw pairing        | 
   |                        | approve clawg-ui ABCD   | 
   |                        |<------------------------| 
   |                        |                         | 
   | POST with Bearer token |                         | 
   |----------------------->|                         | 
   | SSE stream             |                         | 
   |<-----------------------|                         | 
 ``` 
 
 ### Step 1 — Initiate pairing (client sends no auth) 
 
 ```bash 
 curl -X POST http://localhost:18789/v1/clawg-ui \ 
   -H "Content-Type: application/json" \ 
   -d '{}' 
 ``` 
 
 Response (403): 
 ```json 
 { 
   "error": { 
     "type": "pairing_pending", 
     "message": "Device pending approval", 
     "pairing": { 
       "pairingCode": "ABCD1234", 
       "token": "MmRlOTA0ODIt...b71d", 
       "instructions": "Save this token and ask the owner to approve: openclaw pairing approve clawg-ui ABCD1234" 
     } 
   } 
 } 
 ``` 
 
 **Save the `token` — it is your permanent device token for this client.** 
 
 ### Step 2 — Gateway owner approves 
 
 ```bash 
 openclaw pairing list clawg-ui           # see pending requests 
 openclaw pairing approve clawg-ui ABCD1234 
 ``` 
 
 ### Step 3 — Client uses Bearer token 
 
 ```bash 
 curl -N -X POST http://localhost:18789/v1/clawg-ui \ 
   -H "Authorization: Bearer MmRlOTA0ODIt...b71d" \ 
   -H "Content-Type: application/json" \ 
   -H "Accept: text/event-stream" \ 
   -d '{"messages":[{"role":"user","content":"Hello"}]}' 
 ``` 
 
 ### CLI Commands 
 
 | Command | Purpose | 
 |---|---| 
 | `openclaw clawg-ui devices` | List approved devices | 
 | `openclaw pairing list clawg-ui` | List pending pairing requests | 
 | `openclaw pairing approve clawg-ui de>` | Approve a device | 
 
 ### Error Codes 
 
 | Status | Type | Meaning | 
 |---|---|---| 
 | 400 | `invalid_request_error` | Bad JSON or missing messages | 
 | 401 | `unauthorized` | Invalid device token | 
 | 403 | `pairing_pending` | No auth (initiates pairing) or unapproved token | 
 | 405 | — | Method not allowed (only POST accepted) | 
 
 Streaming errors emit `RUN_ERROR` event then close the stream. 
 
 --- 
 
 ## Usage with @ag-ui/client HttpAgent 
 
 ```ts 
 import { HttpAgent } from "@ag-ui/client"; 
 
 const agent = new HttpAgent({ 
   url: "http://localhost:18789/v1/clawg-ui", 
   headers: { Authorization: `Bearer ${process.env.CLAWG_UI_DEVICE_TOKEN}` }, 
 }); 
 
 const stream = agent.run({ 
   threadId: "thread-1", 
   runId:    "run-1", 
   messages: [{ role: "user", content: "Hello from ClawPilot" }], 
 }); 
 
 for await (const event of stream) { 
   console.log(event.type, event); 
 } 
 ``` 
 
 --- 
 
 ## Usage with CopilotKit 
 
 ```tsx 
 import { CopilotKit } from "@copilotkit/react-core"; 
 
 const deviceToken = process.env.REACT_APP_CLAWG_UI_DEVICE_TOKEN; 
 
 function App() { 
   return ( 
     <CopilotKit 
       runtimeUrl="http://localhost:18789/v1/clawg-ui" 
       headers={{ Authorization: `Bearer ${deviceToken}` }} 
     > 
       {/* ClawPilot components */} 
     </CopilotKit> 
   ); 
 } 
 ``` 
 
 --- 
 
 ## Development Setup 
 
 ```bash 
 git clone `https://github.com/contextablemark/clawg-ui`  
 cd clawg-ui 
 npm install 
 npm test 
 ``` 
 
 Source is 100% TypeScript under `src/`. 
 Entry point: `index.ts` 
 Plugin manifest: `openclaw.plugin.json` 
 
 --- 
 
 ## Key Implementation Notes for ClawPilot 
 
 - Store the device token in `.env` as `REACT_APP_CLAWG_UI_DEVICE_TOKEN` or equivalent 
 - On first launch with no token, hit `/v1/clawg-ui` with no auth to get the pairing code, 
   show pairing code to user, and poll or wait for approval before retrying 
 - To route to a specific OpenClaw agent, set header `X-OpenClaw-Agent-Id: <agentId>` 
 - The plugin processes messages through the same pipeline as Telegram/Discord — behavior is identical 
 - `threadId` maps to an OpenClaw session — reuse the same `threadId` across requests to maintain context 
 - Text events and tool call events are split into separate AG-UI runs internally 
 - `RUN_ERROR` closes the stream — reconnect and retry as needed