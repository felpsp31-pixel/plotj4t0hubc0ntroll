import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { Cliente, Solicitante, Obra, Servico, Recibo, EmpresaInfo } from '@/types/recibos';

interface MontanteCliente {
  clienteId: string;
  clienteName: string;
  cnpj: string;
  total: number;
}

interface RecibosContextType {
  empresaInfo: EmpresaInfo;
  setEmpresaInfo: (info: EmpresaInfo) => void;
  clientes: Cliente[];
  addCliente: (c: Omit<Cliente, 'id'>) => void;
  updateCliente: (id: string, c: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;
  solicitantes: Solicitante[];
  addSolicitante: (s: Omit<Solicitante, 'id'>) => void;
  updateSolicitante: (id: string, s: Partial<Solicitante>) => void;
  deleteSolicitante: (id: string) => void;
  obras: Obra[];
  addObra: (o: Omit<Obra, 'id'>) => void;
  updateObra: (id: string, o: Partial<Obra>) => void;
  deleteObra: (id: string) => void;
  servicos: Servico[];
  addServico: (s: Omit<Servico, 'id'>) => void;
  updateServico: (id: string, s: Partial<Servico>) => void;
  deleteServico: (id: string) => void;
  recibos: Recibo[];
  addRecibo: (r: Omit<Recibo, 'id' | 'number'>) => Recibo;
  deleteRecibo: (id: string) => void;
  montantePorCliente: MontanteCliente[];
}

const RecibosContext = createContext<RecibosContextType>({} as RecibosContextType);

export const useRecibos = () => useContext(RecibosContext);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const defaultEmpresa: EmpresaInfo = {
  name: 'Minha Empresa',
  cnpj: '00.000.000/0001-00',
  address: 'Endereço da empresa',
  phone: '(00) 0000-0000',
  email: 'contato@empresa.com',
  logo: '',
};

// --- Helpers for financeiro_clientes sync ---
function loadFinanceiroClientes(): any[] {
  try {
    const raw = localStorage.getItem('financeiro_clientes');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFinanceiroClientes(list: any[]) {
  localStorage.setItem('financeiro_clientes', JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('financeiro_clientes_updated'));
}

function syncAddCliente(cliente: Cliente) {
  const list = loadFinanceiroClientes();
  const exists = list.find((c: any) => c.cnpj === cliente.cnpj);
  if (!exists) {
    list.push({ ...cliente, origem: 'operacional' });
    saveFinanceiroClientes(list);
  }
}

function syncUpdateCliente(cliente: Cliente) {
  const list = loadFinanceiroClientes();
  const idx = list.findIndex((c: any) => c.cnpj === cliente.cnpj || c.id === cliente.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...cliente, origem: list[idx].origem || 'operacional' };
    saveFinanceiroClientes(list);
  }
}

function syncDeleteCliente(cnpj: string) {
  const list = loadFinanceiroClientes();
  const filtered = list.filter((c: any) => c.cnpj !== cnpj);
  saveFinanceiroClientes(filtered);
}

export const RecibosProvider = ({ children }: { children: ReactNode }) => {
  const [empresaInfo, setEmpresaInfoState] = useState<EmpresaInfo>(() => load('recibos_empresa', defaultEmpresa));
  const [clientes, setClientes] = useState<Cliente[]>(() => load('recibos_clientes', []));
  const [solicitantes, setSolicitantes] = useState<Solicitante[]>(() => load('recibos_solicitantes', []));
  const [obras, setObras] = useState<Obra[]>(() => load('recibos_obras', []));
  const [servicos, setServicos] = useState<Servico[]>(() => load('recibos_servicos', []));
  const [recibos, setRecibos] = useState<Recibo[]>(() => load('recibos_recibos', []));

  useEffect(() => { localStorage.setItem('recibos_empresa', JSON.stringify(empresaInfo)); }, [empresaInfo]);
  useEffect(() => { localStorage.setItem('recibos_clientes', JSON.stringify(clientes)); }, [clientes]);
  useEffect(() => { localStorage.setItem('recibos_solicitantes', JSON.stringify(solicitantes)); }, [solicitantes]);
  useEffect(() => { localStorage.setItem('recibos_obras', JSON.stringify(obras)); }, [obras]);
  useEffect(() => { localStorage.setItem('recibos_servicos', JSON.stringify(servicos)); }, [servicos]);
  useEffect(() => { localStorage.setItem('recibos_recibos', JSON.stringify(recibos)); }, [recibos]);

  // Sync montantes to localStorage whenever recibos or clientes change
  const montantePorCliente = useMemo<MontanteCliente[]>(() => {
    return clientes.map(c => ({
      clienteId: c.id,
      clienteName: c.name,
      cnpj: c.cnpj,
      total: recibos
        .filter(r => r.clienteId === c.id)
        .reduce((sum, r) => sum + r.total, 0),
    }));
  }, [clientes, recibos]);

  useEffect(() => {
    localStorage.setItem('operacional_montantes', JSON.stringify(montantePorCliente));
    window.dispatchEvent(new CustomEvent('operacional_montantes_updated'));
  }, [montantePorCliente]);

  const uid = () => crypto.randomUUID();

  const setEmpresaInfo = useCallback((info: EmpresaInfo) => setEmpresaInfoState(info), []);

  const addCliente = useCallback((c: Omit<Cliente, 'id'>) => {
    const newCliente: Cliente = { ...c, id: uid() };
    setClientes(p => [...p, newCliente]);
    syncAddCliente(newCliente);
  }, []);

  const updateCliente = useCallback((id: string, c: Partial<Cliente>) => {
    setClientes(p => {
      const updated = p.map(x => x.id === id ? { ...x, ...c } : x);
      const found = updated.find(x => x.id === id);
      if (found) syncUpdateCliente(found);
      return updated;
    });
  }, []);

  const deleteCliente = useCallback((id: string) => {
    setClientes(p => {
      const toDelete = p.find(x => x.id === id);
      if (toDelete) syncDeleteCliente(toDelete.cnpj);
      return p.filter(x => x.id !== id);
    });
  }, []);

  const addSolicitante = useCallback((s: Omit<Solicitante, 'id'>) => setSolicitantes(p => [...p, { ...s, id: uid() }]), []);
  const updateSolicitante = useCallback((id: string, s: Partial<Solicitante>) => setSolicitantes(p => p.map(x => x.id === id ? { ...x, ...s } : x)), []);
  const deleteSolicitante = useCallback((id: string) => setSolicitantes(p => p.filter(x => x.id !== id)), []);

  const addObra = useCallback((o: Omit<Obra, 'id'>) => setObras(p => [...p, { ...o, id: uid() }]), []);
  const updateObra = useCallback((id: string, o: Partial<Obra>) => setObras(p => p.map(x => x.id === id ? { ...x, ...o } : x)), []);
  const deleteObra = useCallback((id: string) => setObras(p => p.filter(x => x.id !== id)), []);

  const addServico = useCallback((s: Omit<Servico, 'id'>) => setServicos(p => [...p, { ...s, id: uid() }]), []);
  const updateServico = useCallback((id: string, s: Partial<Servico>) => setServicos(p => p.map(x => x.id === id ? { ...x, ...s } : x)), []);
  const deleteServico = useCallback((id: string) => setServicos(p => p.filter(x => x.id !== id)), []);

  const addRecibo = useCallback((r: Omit<Recibo, 'id' | 'number'>): Recibo => {
    const maxNum = recibos.reduce((max, rc) => {
      const n = parseInt(rc.number, 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const newRecibo: Recibo = { ...r, id: uid(), number: String(maxNum + 1).padStart(4, '0') };
    setRecibos(p => [...p, newRecibo]);
    return newRecibo;
  }, [recibos]);

  const deleteRecibo = useCallback((id: string) => setRecibos(p => p.filter(x => x.id !== id)), []);

  return (
    <RecibosContext.Provider value={{
      empresaInfo, setEmpresaInfo,
      clientes, addCliente, updateCliente, deleteCliente,
      solicitantes, addSolicitante, updateSolicitante, deleteSolicitante,
      obras, addObra, updateObra, deleteObra,
      servicos, addServico, updateServico, deleteServico,
      recibos, addRecibo, deleteRecibo,
      montantePorCliente,
    }}>
      {children}
    </RecibosContext.Provider>
  );
};
