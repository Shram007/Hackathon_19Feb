import { useState, useEffect } from 'react';

const VITE_CLAWG_UI_URL = import.meta.env.VITE_CLAWG_UI_URL;

export const useDevicePairing = () => {
  const [isPairing, setIsPairing] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('clawpilot_device_token');
    if (storedToken) {
      setDeviceToken(storedToken);
      setIsApproved(true);
      return;
    }

    const pairDevice = async () => {
      try {
        const response = await fetch(VITE_CLAWG_UI_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        if (response.status === 403) {
          const data = await response.json();
          if (data.error?.type === 'pairing_pending') {
            const { pairingCode, token } = data.error.pairing;
            setPairingCode(pairingCode);
            localStorage.setItem('clawpilot_device_token', token);
            setDeviceToken(token);
            setIsPairing(true);
          }
        }
      } catch (error) {
        console.error('Pairing request failed:', error);
      }
    };

    pairDevice();
  }, []);

  useEffect(() => {
    if (!isPairing || !deviceToken) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(VITE_CLAWG_UI_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deviceToken}`,
          },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'ping' }] }),
        });

        if (response.ok) {
          setIsApproved(true);
          setIsPairing(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Polling for approval failed:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPairing, deviceToken]);

  return { isPairing, pairingCode, isApproved, deviceToken };
};