import React from 'react';

interface PairingModalProps {
  pairingCode: string | null;
}

const PairingModal: React.FC<PairingModalProps> = ({ pairingCode }) => {
  if (!pairingCode) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Device Pairing</h2>
        <p className="mb-4">Please approve the pairing request on your OpenClaw gateway with the following command:</p>
        <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
          <code>{`openclaw pairing approve clawg-ui ${pairingCode}`}</code>
        </pre>
        <p className="mt-4">This modal will automatically close upon approval.</p>
      </div>
    </div>
  );
};

export default PairingModal;