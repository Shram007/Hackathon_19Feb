import React from 'react';

interface PendingToolCall {
  toolCallId: string;
  toolCallName: string;
  args: string;
  runId: string;
}

interface ApprovalPanelProps {
  pendingToolCalls: PendingToolCall[];
  approveTool: (toolCallId: string, result: string) => void;
  rejectTool: (toolCallId: string, reason: string) => void;
}

const ApprovalPanel: React.FC<ApprovalPanelProps> = ({ pendingToolCalls, approveTool, rejectTool }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Approvals</h1>
      {pendingToolCalls.length === 0 ? (
        <p className="text-gray-500">No pending approvals.</p>
      ) : (
        <div className="space-y-4">
          {pendingToolCalls.map((toolCall) => (
            <div key={toolCall.toolCallId} className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-2">{toolCall.toolCallName}</h2>
              <pre className="bg-gray-100 p-2 rounded-md text-sm">{toolCall.args}</pre>
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={() => approveTool(toolCall.toolCallId, 'approved')}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                  Approve
                </button>
                <button
                  onClick={() => rejectTool(toolCall.toolCallId, 'rejected by user')}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApprovalPanel;