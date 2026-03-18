export function useMontantes() {
  const raw = localStorage.getItem('operacional_montantes');
  return raw ? JSON.parse(raw) as { clienteId: string; clienteName: string; cnpj: string; total: number }[] : [];
}
