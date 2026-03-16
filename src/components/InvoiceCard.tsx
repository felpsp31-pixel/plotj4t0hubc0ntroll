import { Paperclip, Calendar, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Invoice } from '@/types/finance';

interface InvoiceCardProps {
  invoice: Invoice;
}

const statusStyles: Record<string, string> = {
  open: 'border-l-primary',
  paid: 'border-l-success',
  overdue: 'border-l-destructive',
};

const InvoiceCard = ({ invoice }: InvoiceCardProps) => {
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(invoice.value);

  const dueFormatted = new Date(invoice.dueDate + 'T00:00:00').toLocaleDateString('pt-BR');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`bg-card rounded-xl shadow-sm hover:shadow-md border border-border border-l-4 ${statusStyles[invoice.status]} p-4 cursor-pointer transition-shadow duration-150`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-2xl font-semibold text-foreground">{formatted}</p>
        {invoice.hasAttachment && (
          <Paperclip className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-2 truncate">{invoice.description}</p>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {dueFormatted}
        </span>
        <span className="flex items-center gap-1">
          <Hash className="h-3.5 w-3.5" />
          {invoice.referenceMonth}
        </span>
      </div>
    </motion.div>
  );
};

export default InvoiceCard;
