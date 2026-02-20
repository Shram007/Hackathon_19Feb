import { useState, useEffect, useRef } from 'react';

const VITE_GATEWAY_WS_URL = import.meta.env.VITE_GATEWAY_WS_URL;
const VITE_CLAWG_UI_DEVICE_TOKEN = import.meta.env.VITE_CLAWG_UI_DEVICE_TOKEN;

export const useGatewayWs = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [skills, setSkills] = useState<any[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!VITE_GATEWAY_WS_URL || !VITE_CLAWG_UI_DEVICE_TOKEN) return;

    ws.current = new WebSocket(`${VITE_GATEWAY_WS_URL}?auth.token=${VITE_CLAWG_UI_DEVICE_TOKEN}`);

    ws.current.onopen = () => {
      setIsConnected(true);
      ws.current?.send(JSON.stringify({ type: 'skills.list' }));
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'skills.list') {
        setSkills(data.skills);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const send = (type: string, payload: object) => {
    ws.current?.send(JSON.stringify({ type, ...payload }));
  };

  return { isConnected, skills, send };
};