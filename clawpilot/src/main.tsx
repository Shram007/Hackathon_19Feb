import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CopilotKit } from '@copilotkit/react-core'

const deviceToken = import.meta.env.VITE_CLAWG_UI_DEVICE_TOKEN

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CopilotKit
      runtimeUrl={import.meta.env.VITE_CLAWG_UI_URL}
      headers={{ Authorization: `Bearer ${deviceToken}` }}
    >
      <App />
    </CopilotKit>
  </StrictMode>,
)
