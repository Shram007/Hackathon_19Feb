import { useState } from 'react';
import { useDevicePairing } from './hooks/useDevicePairing';
import { useAguiStream } from './hooks/useAguiStream';
import PairingModal from './components/PairingModal';
import Sidebar from './components/layout/Sidebar';
import StatusBar from './components/layout/StatusBar';
import TaskList from './components/TaskList';
import ApprovalPanel from './components/ApprovalPanel';
import SkillsPanel from './components/SkillsPanel';
import CanvasPanel from './components/CanvasPanel';

function App() {
  const { pairingCode, isApproved } = useDevicePairing();
  const { runs, pendingToolCalls, isRunning, approveTool, rejectTool } = useAguiStream();
  const [activePanel, setActivePanel] = useState('Tasks');

  if (!isApproved) {
    return <PairingModal pairingCode={pairingCode} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} pendingApprovals={pendingToolCalls.length} />
      <div className="flex-1 flex flex-col">
        <StatusBar isConnected={isRunning} />
        <main className="flex-1 p-8 overflow-y-auto">
          {activePanel === 'Tasks' && <TaskList runs={runs} />}
          {activePanel === 'Approvals' && <ApprovalPanel pendingToolCalls={pendingToolCalls} approveTool={approveTool} rejectTool={rejectTool} />}
          {activePanel === 'Skills' && <SkillsPanel />}
          {activePanel === 'Canvas' && <CanvasPanel />}
        </main>
      </div>
    </div>
  );
}

export default App;
