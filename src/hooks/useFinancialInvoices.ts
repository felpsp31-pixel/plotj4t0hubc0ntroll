import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Invoice, Attachment } from '@/types/finance';
import { MOCK_INVOICES } from '@/types/finance';
import { toast } from 'sonner';

export function useFinancialInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    const { data, error } = await supabase
      .from('financial_invoices')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching invoices:', error);
      return;
    }

    const dbInvoices: Invoice[] = (data || []).map((row) => ({
      id: row.id,
      entityId: row.entity_id,
      description: row.description,
      value: Number(row.value),
      dueDate: row.due_date,
      referenceMonth: row.reference_month,
      status: row.status as Invoice['status'],
      attachments: (row.attachments as unknown as Attachment[]) || [],
    }));

    // Merge: mock invoices + db invoices (db invoices won't have mock ids)
    const mockIds = new Set(MOCK_INVOICES.map((m) => m.id));
    const combined = [...MOCK_INVOICES, ...dbInvoices.filter((d) => !mockIds.has(d.id))];
    setInvoices(combined);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleMarkPaid = useCallback(async (invoiceId: string) => {
    const previous = invoices.find((inv) => inv.id === invoiceId);
    if (!previous) return;
    const previousStatus = previous.status;

    setInvoices((prev) =>
      prev.map((inv) => inv.id === invoiceId ? { ...inv, status: 'paid' as const } : inv)
    );

    // If it's a DB invoice (UUID format), update in DB
    if (invoiceId.includes('-')) {
      await supabase.from('financial_invoices').update({ status: 'paid' }).eq('id', invoiceId);
    }

    toast.success('Título marcado como pago!', {
      action: {
        label: 'Desfazer',
        onClick: async () => {
          setInvoices((prev) =>
            prev.map((inv) => inv.id === invoiceId ? { ...inv, status: previousStatus } : inv)
          );
          if (invoiceId.includes('-')) {
            await supabase.from('financial_invoices').update({ status: previousStatus }).eq('id', invoiceId);
          }
          toast.info('Ação desfeita.');
        },
      },
      duration: 6000,
    });
  }, [invoices]);

  const handleDelete = useCallback(async (invoiceId: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    if (invoiceId.includes('-')) {
      await supabase.from('financial_invoices').delete().eq('id', invoiceId);
    }
    toast.success('Lançamento apagado.');
  }, []);

  const handleUpdate = useCallback(async (invoiceId: string, data: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((inv) => inv.id === invoiceId ? { ...inv, ...data } : inv)
    );
    if (invoiceId.includes('-')) {
      const dbData: Record<string, unknown> = {};
      if (data.description !== undefined) dbData.description = data.description;
      if (data.value !== undefined) dbData.value = data.value;
      if (data.dueDate !== undefined) dbData.due_date = data.dueDate;
      if (data.status !== undefined) dbData.status = data.status;
      if (data.referenceMonth !== undefined) dbData.reference_month = data.referenceMonth;
      if (data.attachments !== undefined) dbData.attachments = data.attachments;
      if (Object.keys(dbData).length > 0) {
        await supabase.from('financial_invoices').update(dbData).eq('id', invoiceId);
      }
    }
    toast.success('Lançamento atualizado.');
  }, []);

  const handleAdd = useCallback(async (invoice: Invoice) => {
    setInvoices((prev) => [...prev, invoice]);
    // Also persist to DB
    await supabase.from('financial_invoices').insert([{
      entity_id: invoice.entityId,
      entity_name: '',
      description: invoice.description,
      value: invoice.value,
      due_date: invoice.dueDate,
      reference_month: invoice.referenceMonth,
      status: invoice.status,
      attachments: invoice.attachments as unknown as Record<string, unknown>[],
    }]);
    toast.success('Lançamento adicionado.');
  }, []);

  return { invoices, loading, handleMarkPaid, handleDelete, handleUpdate, handleAdd, refetch: fetchInvoices };
}
