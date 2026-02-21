# OpenClaw Canvas & A2UI — Agent Context File 
 
 **Docs:** `https://docs.openclaw.ai/platforms/mac/canvas#a2ui-in-canvas`  
 
 --- 
 
 ## What Canvas Is 
 
 Canvas is a macOS-only, agent-controlled panel rendered inside a `WKWebView` 
 embedded in the OpenClaw macOS companion app. It is a lightweight visual workspace 
 for HTML/CSS/JS and A2UI declarative UI surfaces. 
 
 Canvas is **optional** for ClawPilot. The core AG-UI stream (via clawg-ui) works 
 without Canvas. Canvas is an advanced/secondary view for richer agent-generated layouts. 
 
 --- 
 
 ## Where Canvas Lives (macOS) 
 
 Files are stored under Application Support: 
 ``` 
 ~/Library/Application Support/OpenClaw/canvas/<session>/... 
 ``` 
 
 Served via a custom URL scheme (no loopback server needed for local files): 
 ``` 
 openclaw-canvas:///<path> 
 ``` 
 
 Examples: 
 | URL | Maps to | 
 |---|---| 
 | `openclaw-canvas://main/` | `/main/index.html` | 
 | `openclaw-canvas://main/assets/app.css` | `/main/assets/app.css` | 
 | `openclaw-canvas://main/widgets/todo/` | `/main/widgets/todo/index.html` | 
 
 If no `index.html` exists at root → built-in scaffold page is shown. 
 
 --- 
 
 ## Canvas Panel Behavior 
 
 - Borderless, resizable panel anchored near the menu bar or mouse cursor 
 - Remembers size and position per session 
 - **Auto-reloads** when local canvas files change 
 - Only one Canvas panel visible at a time (sessions are switched as needed) 
 - Can be disabled: Settings → **Allow Canvas** → when disabled, canvas commands return `CANVAS_DISABLED` 
 
 --- 
 
 ## Agent API Surface (via Gateway WebSocket) 
 
 Canvas is exposed through the **Gateway WebSocket** on port 18789. 
 The agent can send these canvas commands: 
 
 | Command | What it does | 
 |---|---| 
 | `canvas present` | Show/bring the Canvas panel to front | 
 | `canvas navigate --url <path>` | Navigate to a local canvas path, http(s), or file:// URL | 
 | `canvas eval --js "de>"` | Evaluate JavaScript inside the Canvas WebView | 
 | `canvas snapshot` | Capture a screenshot image of the Canvas panel | 
 | `canvas a2ui push --jsonl <file>` | Push A2UI v0.8 declarative commands to Canvas | 
 
 CLI examples: 
 ```bash 
 openclaw nodes canvas present    --node <id> 
 openclaw nodes canvas navigate   --node <id> --url "/" 
 openclaw nodes canvas eval       --node <id> --js "document.title" 
 openclaw nodes canvas snapshot   --node <id> 
 openclaw nodes canvas a2ui push  --node <id> --jsonl /tmp/payload.jsonl 
 openclaw nodes canvas a2ui push  --node <id> --text "Hello from A2UI" 
 ``` 
 
 Notes: 
 - `canvas navigate` accepts local canvas paths, `http(s)://` URLs, and `file://` URLs 
 - Passing `"/"` shows the local scaffold or `index.html` 
 - `--node <id>` targets a specific connected node (from `openclaw node list`) 
 
 --- 
 
 ## A2UI in Canvas 
 
 A2UI is the **declarative UI spec** rendered inside Canvas. It is hosted by the 
 Gateway canvas host and served at: 
 
 ``` 
 http://<gateway-host>:18789/__openclaw__/a2ui/ 
 ``` 
 
 When the Gateway advertises a Canvas host, the macOS app **auto-navigates** to this 
 A2UI host page on first open. 
 
 ### For ClawPilot Browser Use 
 
 In a browser React app (not macOS WKWebView), the simplest pattern is: 
 ```tsx 
 <iframe src="http://localhost:18789/__openclaw__/a2ui/" /> 
 ``` 
 
 This lets the macOS Canvas renderer handle all A2UI rendering natively while 
 ClawPilot just embeds it as a panel. No need to re-implement A2UI rendering in React. 
 
 --- 
 
 ## A2UI Commands — v0.8 (Currently Supported) 
 
 Canvas accepts **A2UI v0.8** server→client messages pushed as JSONL. 
 
 Supported commands: 
 | Command | Purpose | 
 |---|---| 
 | `beginRendering` | Signal that the surface is ready to render | 
 | `surfaceUpdate` | Push component tree updates to a surface | 
 | `dataModelUpdate` | Update the data model bound to components | 
 | `deleteSurface` | Remove a surface | 
 
 NOT supported: `createSurface` (v0.9) — not yet implemented. 
 
 --- 
 
 ## A2UI v0.8 Payload Format 
 
 Payloads are **JSONL** (one JSON object per line), pushed via `canvas a2ui push`. 
 
 ### Component Tree Example 
 
 ```jsonl 
 {"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"ClawPilot Dashboard"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"Agent is running..."},"usageHint":"body"}}}]}} 
 {"beginRendering":{"surfaceId":"main","root":"root"}} 
 ``` 
 
 ### Key A2UI Primitives (v0.8) 
 
 | Component | Purpose | 
 |---|---| 
 | `Column` | Vertical layout container — `children.explicitList: [id, id, ...]` | 
 | `Text` | Text node — `text.literalString`, `usageHint: "h1"\|"body"\|"caption"` | 
 
 Data binding: 
 - `text.literalString` → static string 
 - `text.dataBinding` → bind to data model key (via `dataModelUpdate`) 

### Quick Smoke Test

```bash
# Push a simple text label to Canvas
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

### Triggering Agent Runs from Canvas

Canvas can trigger new agent runs back to OpenClaw via deep links:

```js
// Inside Canvas JS (executed via canvas eval or local index.html)
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

The app prompts the user for confirmation unless a valid key is provided.
Useful for building interactive Canvas surfaces that kick off agent tasks.

### Security Notes

- Canvas scheme blocks directory traversal — files must live under the session root
- Local Canvas content uses the custom `openclaw-canvas://` scheme (no loopback server needed)
- External `http(s)://` URLs are allowed only when explicitly navigated to
- Canvas can be fully disabled in Settings → Allow Canvas

### ClawPilot Integration Pattern for Canvas

Since ClawPilot is a browser React app (not a macOS WKWebView), use this approach:

#### Minimal CanvasPanel.tsx Pattern

```tsx
// Option 1: iframe embed (simplest — let macOS handle A2UI natively)
<iframe
  src="http://localhost:18789/__openclaw__/a2ui/"
  style={{ width: "100%", height: "100%", border: "none" }}
/>
```

```tsx
// Option 2: toggle panel visibility
const [showCanvas, setShowCanvas] = useState(false);

return (
  <>
    <button onClick={() => setShowCanvas(v => !v)}>Toggle Canvas</button>
    {showCanvas && 
      <iframe src="http://localhost:18789/__openclaw__/a2ui/" />
    }
  </>
);
```

#### When to Show Canvas

- Show Canvas panel only on macOS (where Gateway has Canvas host advertised)
- Detect availability: attempt to fetch `http://localhost:18789/__openclaw__/a2ui/` and render the iframe only if the response is 200
- Keep Canvas as an optional collapsible panel — not required for core ClawPilot features

### What ClawPilot Should and Should NOT Do with Canvas

| DO | DON'T |
|---|---|
| `iframe /__openclaw__/a2ui/` as a panel | Re-implement A2UI component rendering in React |
| Toggle Canvas visibility | Assume Canvas is always available (macOS only) |
| Let agent push A2UI payloads via `canvas a2ui push` | Manually construct A2UI payloads from the frontend |
| Fall back gracefully when Canvas is unavailable | Block core UI on Canvas availability |

### Summary: A2UI vs AG-UI (Critical Distinction)

| | AG-UI | A2UI |
|---|---|---|
| **What it is** | Agent↔User event stream protocol | Declarative UI widget/surface spec |
| **Transport** | HTTP SSE / WebSocket | JSONL pushed via Gateway WS |
| **Who consumes it** | React app via CopilotKit / HttpAgent | Canvas WKWebView (macOS/iOS/Android) |
| **Used for** | Task list, approvals, chat streaming | Rich visual layouts, data-bound widgets |
| **Required for ClawPilot** | **YES** — core protocol | **NO** — optional advanced panel |
| **ClawPilot integration** | `CopilotKit runtimeUrl` → `clawg-ui` | `<iframe src="/__openclaw__/a2ui/" />` |