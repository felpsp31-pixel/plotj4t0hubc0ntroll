import type { Invoice, InvoiceStatus } from '@/types/finance';

interface StatusSummaryCardsProps {
  invoices: Invoice[];
}

const STATUS_CONFIG: { status: InvoiceStatus; label: string; dotClass: string; bgClass: string }[] = [
  { status: 'open', label: 'Em Aberto', dotClass: 'bg-primary', bgClass: 'bg-primary/10' },
  { status: 'paid', label: 'Pago', dotClass: 'bg-success', bgClass: 'bg-success/10' },
  { status: 'overdue', label: 'Atrasado', dotClass: 'bg-destructive', bgClass: 'bg-destructive/10' },
];

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const StatusSummaryCards = ({ invoices }: StatusSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-3 gap-4 mb-5">
      {STATUS_CONFIG.map(({ status, label, dotClass, bgClass }) => {
        const items = invoices.filter((inv) => inv.status === status);
        const total = items.reduce((sum, inv) => sum + inv.value, 0);
        return (
          <div key={status} className={`${bgClass} rounded-xl p-4 border border-border`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{items.length} título(s)</span>
            </div>
            <p className="text-xl font-bold text-foreground">{fmt(total)}</p>
          </div>
        );
      })}
    </div>
  );
};

export default StatusSummaryCards;
