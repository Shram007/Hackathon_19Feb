import React, { useState, useEffect } from 'react';

const CanvasPanel: React.FC = () => {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    fetch('http://localhost:18789/__openclaw__/a2ui/', { method: 'HEAD' })
      .then(r => {
        if (r.ok) setAvailable(true);
      })
      .catch(() => setAvailable(false));
  }, []);

  if (!available) {
    return <div className="p-8 text-gray-500">Canvas not available (macOS only).</div>;
  }

  return (
    <iframe
      src="http://localhost:18789/__openclaw__/a2ui/"
      style={{ width: '100%', height: '100%', border: 'none' }}
      title="OpenClaw Canvas"
    />
  );
};

export default CanvasPanel;