import { useState, useEffect } from 'react';

export function useMontantes() {
  const [data, setData] = useState<{ clienteId: string; clienteName: string; cnpj: string; total: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem('operacional_montantes') ?? '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'operacional_montantes') {
        try { setData(JSON.parse(e.newValue ?? '[]')); } catch { setData([]); }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return data;
}
