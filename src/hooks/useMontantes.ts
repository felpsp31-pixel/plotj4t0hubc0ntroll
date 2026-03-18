import { useState, useEffect } from 'react';

export function useMontantes() {
  const [data, setData] = useState<{ clienteId: string; clienteName: string; cnpj: string; total: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem('operacional_montantes') ?? '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    const refresh = () => {
      try { setData(JSON.parse(localStorage.getItem('operacional_montantes') ?? '[]')); }
      catch { setData([]); }
    };
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'operacional_montantes') refresh();
    };
    window.addEventListener('storage', storageHandler);
    window.addEventListener('operacional_montantes_updated', refresh);
    return () => {
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener('operacional_montantes_updated', refresh);
    };
  }, []);

  return data;
}
