# AG-UI Protocol — Agent Context File 
 
 **Repo:** `https://github.com/ag-ui-protocol/ag-ui`  
 **Docs:** `https://docs.ag-ui.com/introduction`  
 **Events:** `https://docs.ag-ui.com/concepts/events`  
 **Architecture:** `https://docs.ag-ui.com/concepts/architecture`  
 
 --- 
 
 ## What AG-UI Is 
 
 AG-UI (Agent–User Interaction Protocol) is an open, lightweight, event-based protocol 
 that standardizes how AI agent backends stream events to user-facing frontend applications. 
 
 Protocol stack position: 
 - MCP  → Agent ↔ Tools/Data 
 - A2A  → Agent ↔ Agent 
 - AG-UI → Agent ↔ User  ← THIS ONE 
 
 AG-UI is NOT the same as A2UI. 
 - A2UI = declarative UI widget spec rendered inside Canvas panels 
 - AG-UI = the event stream protocol connecting agents to any frontend 
 They are complementary. Both are used in ClawPilot. 
 
 --- 
 
 ## Core Protocol Contract 
 
 ```ts 
 // What you POST to the agent endpoint 
 interface RunAgentInput { 
   threadId: string      // conversation thread ID 
   runId:    string      // unique ID for this run 
   messages: Message[]   // at least one "user" message required 
   tools?:   Tool[]      // optional client-side tool definitions 
   state?:   object      // optional shared state 
 } 
 
 // What every agent must return 
 type RunAgent = () => Observable<BaseEvent> 
 
 // Base shape — every event extends this 
 interface BaseEvent { 
   type:       EventType   // string enum 
   timestamp?: number 
   rawEvent?:  any 
 } 
 ``` 
 
 --- 
 
 ## Complete Event Type Reference 
 
 ### Lifecycle (RUN_STARTED + RUN_FINISHED or RUN_ERROR are MANDATORY per run) 
 
 | Event | Key Fields | 
 |---|---| 
 | `RUN_STARTED` | `threadId`, `runId`, `parentRunId?`, `input?` | 
 | `RUN_FINISHED` | `threadId`, `runId`, `result?` | 
 | `RUN_ERROR` | `message`, `code?` | 
 | `STEP_STARTED` | `stepName` | 
 | `STEP_FINISHED` | `stepName` | 
 
 ### Text Message Events — pattern: Start → Content(s) → End 
 
 | Event | Key Fields | 
 |---|---| 
 | `TEXT_MESSAGE_START` | `messageId`, `role` | 
 | `TEXT_MESSAGE_CONTENT` | `messageId`, `delta` (append to buffer) | 
 | `TEXT_MESSAGE_END` | `messageId` | 
 | `TEXT_MESSAGE_CHUNK` | `messageId?`, `role?`, `delta?` — convenience, auto-expands | 
 
 ### Tool Call Events — pattern: Start → Args(s) → End 
 
 | Event | Key Fields | 
 |---|---| 
 | `TOOL_CALL_START` | `toolCallId`, `toolCallName`, `parentMessageId?` | 
 | `TOOL_CALL_ARGS` | `toolCallId`, `delta` (JSON fragment, concatenate) | 
 | `TOOL_CALL_END` | `toolCallId` | 
 | `TOOL_CALL_RESULT` | `messageId`, `toolCallId`, `content`, `role?` | 
 | `TOOL_CALL_CHUNK` | `toolCallId?`, `toolCallName?`, `delta?` — convenience, auto-expands | 
 
 ### State Management Events — pattern: Snapshot then Deltas 
 
 | Event | Key Fields | 
 |---|---| 
 | `STATE_SNAPSHOT` | `snapshot` — full object, replace client state entirely | 
 | `STATE_DELTA` | `delta` — RFC 6902 JSON Patch array, apply in order | 
 | `MESSAGES_SNAPSHOT` | `messages` — full conversation history array | 
 
 ### Activity Events 
 
 | Event | Key Fields | 
 |---|---| 
 | `ACTIVITY_SNAPSHOT` | `messageId`, `activityType`, `content`, `replace?` | 
 | `ACTIVITY_DELTA` | `messageId`, `activityType`, `patch` (RFC 6902) | 
 
 ### Special Events 
 
 | Event | Key Fields | 
 |---|---| 
 | `RAW` | `event`, `source?` — passthrough from external systems | 
 | `CUSTOM` | `name`, `value` — app-specific extension | 
 
 ### Reasoning Events (replaces deprecated THINKING_*) 
 
 | Event | Key Fields | 
 |---|---| 
 | `REASONING_START` / `REASONING_END` | `messageId` | 
 | `REASONING_MESSAGE_START/CONTENT/END/CHUNK` | `messageId`, `delta` | 
 | `REASONING_ENCRYPTED_VALUE` | `subtype`, `entityId`, `encryptedValue` | 
 
 --- 
 
 ## Three Core Flow Patterns 
 
 1. **Start → Content(s) → End** — streaming text and tool args 
 2. **Snapshot → Delta** — state sync (RFC 6902 JSON Patch) 
 3. **Lifecycle** — RUN_STARTED wraps everything, ends with RUN_FINISHED or RUN_ERROR 
 
 --- 
 
 ## HttpAgent (Standard Client) 
 
 ```ts 
 import { HttpAgent } from "@ag-ui/client"; 
 
 const agent = new HttpAgent({ 
   url: "http://localhost:18789/v1/clawg-ui", 
   headers: { Authorization: `Bearer ${deviceToken}` }, 
 }); 
 
 const stream = agent.run({ 
   threadId: "thread-1", 
   runId:    "run-1", 
   messages: [{ role: "user", content: "Hello" }], 
 }); 
 
 for await (const event of stream) { 
   switch (event.type) { 
     case "TEXT_MESSAGE_CONTENT": break; // append delta 
     case "TOOL_CALL_START":      break; // show tool name 
     case "RUN_FINISHED":         break; // finalize UI 
   } 
 } 
 ``` 
 
 Transports supported: 
 - HTTP SSE (Server-Sent Events) — default, easy to debug 
 - HTTP binary — high performance, production use 
 
 --- 
 
 ## CopilotKit — Primary React Client 
 
 ```bash 
 npm install @copilotkit/react-core @copilotkit/react-ui @ag-ui/client 
 ``` 
 
 ```tsx 
 import { CopilotKit } from "@copilotkit/react-core"; 
 
 function App() { 
   return ( 
     <CopilotKit 
       runtimeUrl="http://localhost:18789/v1/clawg-ui" 
       headers={{ Authorization: `Bearer ${deviceToken}` }} 
     > 
       {/* components go here */} 
     </CopilotKit> 
   ); 
 } 
 ``` 
 
 Key hooks: 
 | Hook | Purpose | 
 |---|---| 
 | `useCoAgent(name, initialState)` | Subscribe to named agent's shared state | 
 | `useCopilotChat()` | Send messages, access streaming chat history | 
 | `useCopilotAction(action)` | Register frontend tool handler (HITL approvals) | 
 | `useCoAgentStateRender(name, render)` | Render agent state as live React UI | 
 
 --- 
 
 ## Human-in-the-Loop (HITL) Pattern 
 
 1. Agent emits `TOOL_CALL_START` for a risky tool (shell, email, etc.) 
 2. Frontend intercepts via `useCopilotAction` or by watching `TOOL_CALL_START` events 
 3. Render approval UI — approve / reject buttons 
 4. Approved → send result back through AG-UI input channel 
 5. Rejected → send rejection; agent aborts or routes around the tool 
 6. Draft spec: `RUN_FINISHED { outcome: "interrupt", interrupt: {...} }` for explicit pause/resume 
 
 --- 
 
 ## Implementation Rules 
 
 - Process events **in order received** 
 - Events sharing `messageId` or `toolCallId` belong to the same logical stream 
 - Be resilient to out-of-order delivery 
 - `TEXT_MESSAGE_CHUNK` and `TOOL_CALL_CHUNK` auto-expand — no manual Start/End needed 
 - Use `CUSTOM` events for app-specific signals (e.g., skill trigger confirmations) 
 - If `STATE_DELTA` patches cause divergence, request a fresh `STATE_SNAPSHOT` 
 - `TEXT_MESSAGE_CONTENT.delta` values must be concatenated in order to reconstruct full message 
 - `TOOL_CALL_ARGS.delta` values are JSON fragments — concatenate then parse as one JSON object