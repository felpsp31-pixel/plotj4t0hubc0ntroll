import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooter } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Entity, Invoice, InvoiceStatus } from '@/types/finance';

interface SuppliersTableProps {
  entities: Entity[];
  invoices: Invoice[];
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string }> = {
  open: { label: 'Em Aberto', color: 'hsl(217, 91%, 60%)' },
  paid: { label: 'Pago', color: 'hsl(142, 71%, 45%)' },
  overdue: { label: 'Atrasado', color: 'hsl(0, 84%, 60%)' },
};

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const SuppliersTable = ({ entities, invoices }: SuppliersTableProps) => {
  const suppliers = entities.filter((e) => e.type === 'supplier');
  const supplierInvoices = invoices.filter((inv) =>
    suppliers.some((s) => s.id === inv.entityId)
  );

  // --- Supplier rows ---
  const supplierData = suppliers.map((supplier) => {
    const invs = supplierInvoices.filter((inv) => inv.entityId === supplier.id);
    const total = invs.reduce((sum, inv) => sum + inv.value, 0);
    return { ...supplier, total, invoiceCount: invs.length };
  });

  const grandTotal = supplierData.reduce((sum, s) => sum + s.total, 0);

  // --- Monthly chart data ---
  const monthMap = new Map<string, { open: number; paid: number; overdue: number }>();

  supplierInvoices.forEach((inv) => {
    const month = inv.referenceMonth;
    if (!monthMap.has(month)) {
      monthMap.set(month, { open: 0, paid: 0, overdue: 0 });
    }
    const entry = monthMap.get(month)!;
    entry[inv.status] += inv.value;
  });

  // Sort months chronologically
  const monthOrder = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const chartData = Array.from(monthMap.entries())
    .sort((a, b) => {
      const [mA, yA] = a[0].split('/');
      const [mB, yB] = b[0].split('/');
      if (yA !== yB) return Number(yA) - Number(yB);
      return monthOrder.indexOf(mA) - monthOrder.indexOf(mB);
    })
    .map(([month, values]) => ({
      month,
      ...values,
    }));

  return (
    <div className="space-y-6">
      {/* Monthly Bar Chart */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Valores Mensais — Fornecedores</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const cfg = STATUS_CONFIG[name as InvoiceStatus];
                  return [fmt(value), cfg?.label ?? name];
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Legend
                formatter={(value: string) => {
                  const cfg = STATUS_CONFIG[value as InvoiceStatus];
                  return cfg?.label ?? value;
                }}
              />
              <Bar dataKey="paid" stackId="a" fill={STATUS_CONFIG.paid.color} radius={[0, 0, 0, 0]} />
              <Bar dataKey="open" stackId="a" fill={STATUS_CONFIG.open.color} radius={[0, 0, 0, 0]} />
              <Bar dataKey="overdue" stackId="a" fill={STATUS_CONFIG.overdue.color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Totals by status */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {(['open', 'paid', 'overdue'] as InvoiceStatus[]).map((status) => {
            const total = supplierInvoices
              .filter((inv) => inv.status === status)
              .reduce((sum, inv) => sum + inv.value, 0);
            const pct = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : '0.0';
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status} className="bg-secondary/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <span className="text-xs font-medium text-muted-foreground">{cfg.label}</span>
                </div>
                <p className="text-lg font-bold text-foreground">{fmt(total)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead className="text-center">Títulos</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supplierData.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell className="text-muted-foreground">{supplier.document ?? '—'}</TableCell>
                <TableCell className="text-center">{supplier.invoiceCount}</TableCell>
                <TableCell className="text-right font-semibold">{fmt(supplier.total)}</TableCell>
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
    </div>
  );
};

export default SuppliersTable;
