import { useState, useEffect } from 'react';

export function useClientesFinanceiro() {
  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('financeiro_clientes') ?? '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'financeiro_clientes') {
        try { setData(JSON.parse(e.newValue ?? '[]')); } catch { setData([]); }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return data;
}
