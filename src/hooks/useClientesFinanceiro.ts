export function useClientesFinanceiro() {
  const raw = localStorage.getItem('financeiro_clientes');
  return raw ? JSON.parse(raw) : [];
}
