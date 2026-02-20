import React from 'react';

interface StatusBarProps {
  isConnected: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ isConnected }) => {
  return (
    <div className="bg-gray-200 p-2 text-sm text-gray-700 flex items-center">
      <span className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
      <span>{isConnected ? 'Gateway Connected' : 'Gateway Disconnected'}</span>
    </div>
  );
};

export default StatusBar;