import { useEffect } from 'react';
import { useRecibos } from '@/contexts/RecibosContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Syncs monthly recibo totals per client to the backend
 * so the cron job can generate financial invoices.
 */
export function useSyncReciboSummaries() {
  const { clientes, recibos } = useRecibos();

  useEffect(() => {
    if (clientes.length === 0) return;

    const timer = setTimeout(() => {
      // Group recibos by client + month
      const summaryMap = new Map<string, { clienteId: string; clienteName: string; cnpj: string; month: string; total: number }>();

      for (const recibo of recibos) {
        const cliente = clientes.find((c) => c.id === recibo.clienteId);
        if (!cliente) continue;

        const month = recibo.date.slice(0, 7);
        const key = `${cliente.cnpj}-${month}`;

        const existing = summaryMap.get(key);
        if (existing) {
          existing.total += recibo.total;
        } else {
          summaryMap.set(key, {
            clienteId: cliente.id,
            clienteName: cliente.name,
            cnpj: cliente.cnpj,
            month,
            total: recibo.total,
          });
        }
      }

      const entries = Array.from(summaryMap.values());
      if (entries.length === 0) return;

      const upsertData = entries.map((e) => ({
        cliente_id: e.clienteId,
        cliente_name: e.clienteName,
        cnpj: e.cnpj,
        month: e.month,
        total: e.total,
        processed: false,
      }));

      supabase
        .from('monthly_recibo_summaries')
        .upsert(upsertData, { onConflict: 'cnpj,month' })
        .then(({ error }) => {
          if (error) console.error('Error syncing recibo summaries:', error);
        });
    }, 1500);

    return () => clearTimeout(timer);
  }, [clientes, recibos]);
}
