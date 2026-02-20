import React from 'react';

interface Run {
  runId: string;
  status: 'running' | 'finished' | 'error';
  steps: any[];
  messages: string[];
  startedAt: number;
  finishedAt?: number;
  error?: string;
}

interface TaskListProps {
  runs: Run[];
}

const TaskList: React.FC<TaskListProps> = ({ runs }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Tasks</h1>
      <div className="space-y-4">
        {runs.map((run) => (
          <div key={run.runId} className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-sm text-gray-500">{run.runId}</span>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  run.status === 'running'
                    ? 'bg-blue-200 text-blue-800'
                    : run.status === 'finished'
                    ? 'bg-green-200 text-green-800'
                    : 'bg-red-200 text-red-800'
                }`}>
                {run.status}
              </span>
            </div>
            <div className="text-sm text-gray-700">
              <p>Started: {new Date(run.startedAt).toLocaleTimeString()}</p>
              {run.finishedAt && <p>Finished: {new Date(run.finishedAt).toLocaleTimeString()}</p>}
            </div>
            <div className="mt-2">
              <h3 className="font-semibold">Steps:</h3>
              <ul className="list-disc list-inside">
                {run.steps.map((step, index) => (
                  <li key={index} className="text-sm">{step.name} {step.duration && `(${step.duration})`}</li>
                ))}
              </ul>
            </div>
            <div className="mt-2">
              <h3 className="font-semibold">Messages:</h3>
              <pre className="bg-gray-100 p-2 rounded-md text-sm">{run.messages.join('')}</pre>
            </div>
            {run.error && (
              <div className="mt-2 text-red-600">
                <h3 className="font-semibold">Error:</h3>
                <p>{run.error}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;