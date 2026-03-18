import { useState, useEffect } from 'react';

export function useClientesFinanceiro() {
  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('financeiro_clientes') ?? '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    const refresh = () => {
      try { setData(JSON.parse(localStorage.getItem('financeiro_clientes') ?? '[]')); }
      catch { setData([]); }
    };
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'financeiro_clientes') refresh();
    };
    window.addEventListener('storage', storageHandler);
    window.addEventListener('financeiro_clientes_updated', refresh);
    return () => {
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener('financeiro_clientes_updated', refresh);
    };
  }, []);

  return data;
}
