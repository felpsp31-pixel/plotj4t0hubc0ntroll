import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooter } from '@/components/ui/table';
import type { Entity, Invoice } from '@/types/finance';

interface ClientsTableProps {
  entities: Entity[];
  invoices: Invoice[];
}

const ClientsTable = ({ entities, invoices }: ClientsTableProps) => {
  const clients = entities.filter((e) => e.type === 'client');

  const clientData = clients.map((client) => {
    const clientInvoices = invoices.filter((inv) => inv.entityId === client.id);
    const total = clientInvoices.reduce((sum, inv) => sum + inv.value, 0);
    return { ...client, total, invoiceCount: clientInvoices.length };
  });

  const grandTotal = clientData.reduce((sum, c) => sum + c.total, 0);

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead className="text-center">Títulos</TableHead>
            <TableHead className="text-right">Valor Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientData.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell className="text-muted-foreground">{client.document ?? '—'}</TableCell>
              <TableCell className="text-center">{client.invoiceCount}</TableCell>
              <TableCell className="text-right font-semibold">{fmt(client.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="font-semibold">Montante Total</TableCell>
            <TableCell className="text-right font-bold text-primary text-base">{fmt(grandTotal)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default ClientsTable;
