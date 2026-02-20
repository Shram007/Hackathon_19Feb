# ClawPilot — OpenClaw Canvas + AG-UI Demo

Production-ready hack night dashboard that wires OpenClaw runs, AG-UI events, clawg-ui components, and Canvas deep links. Includes SkillsPanel toggles, Canvas snapshots, and deploy polish for Vercel.

## Features
- Run launcher + approvals: start OpenClaw runs, view telemetry, approve/reject tools.
- SkillsPanel: enable invoice/todo Canvas widgets via AG-UI `createSurface` + `/skills` POST; emits `surfaceUpdate`.
- Canvas deep links: `openclaw-canvas://main/widgets/invoice/`, `openclaw://agent?message=...`.
- Canvas snapshot emitter for state capture.
- Error boundary emits AG-UI `error` events.
- PWA manifest + dark gradient theme.
- Vercel proxy route `/api/ag-ui-proxy` for AG-UI SSE/WS passthrough.

## Quickstart
```bash
npm install
npm run dev        # UI on 3000, agent via uv on 9000
# env
export VITE_OPENCLAW_URL=http://localhost:8000
export JAM_MCP_TOKEN=...
```

## AG-UI Event Diagram
```
curl /v1/chat/completions
   -> AG-UI surfaceUpdate (run id/status)
      -> clawg-ui renders TaskCard / telemetry

Skills toggle (invoice/todo)
   -> POST /skills {skill, enabled}
   -> surfaceUpdate (status pending/synced/error)
   -> createSurface openclaw-canvas://main/widgets/{invoice|todo}/
   -> Canvas deep link navigates widget
```

## Test matrix
- curl http://localhost:8000/v1/chat/completions → see run appear in dashboard.
- Toggle skill in SkillsPanel → POST succeeds; surfaceUpdate status changes; deep link shown.
- Click “Capture snapshot” → emits surfaceUpdate snapshot event (see console/AG-UI listeners).
- PWA: manifest loads (`/manifest.json`) and icons resolve.
- Error boundary: force throw to see AG-UI `error` event.

## Files of interest
- `src/components/Dashboard.jsx` — 3-column layout, telemetry, snapshot, deep link.
- `src/components/SkillsPanel.jsx` — toggles, createSurface, surfaceUpdate, Canvas links.
- `src/hooks/useOpenClaw.js` — polling, approvals, AG-UI event emit helper.
- `src/components/ErrorBoundary.jsx` — emits AG-UI error events.
- `src/app/api/ag-ui-proxy/route.ts` — Vercel/Next proxy for AG-UI SSE/WS.
- `public/manifest.json` — PWA config.
- `vercel.json` — routes for proxy + catchall.

## Demo GIF
Add a GIF at `public/demo.gif` and link it here once recorded.

## Deploy
- Set `VITE_OPENCLAW_URL` in Vercel env.
- Ensure `/api/ag-ui-proxy` target upstream is reachable.
- Use `npm run build` / `npm start` for production.
