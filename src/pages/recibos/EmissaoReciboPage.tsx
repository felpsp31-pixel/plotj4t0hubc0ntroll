import { useState, useMemo, useEffect } from 'react';
import { useRecibos } from '@/contexts/RecibosContext';
import Combobox from '@/components/recibos/Combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { LinhaRecibo } from '@/types/recibos';

const formatDate = (date: string) => {
  if (!date) return '—';
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
};

const emptyLines = (): LinhaRecibo[] =>
  Array.from({ length: 10 }, () => ({ serviceCode: '', description: '', quantity: 0, unitPrice: 0, total: 0 }));

const EmissaoReciboPage = () => {
  const { clientes, solicitantes, obras, servicos, recibos, addRecibo, empresaInfo, loading } = useRecibos();
  const [clienteId, setClienteId] = useState('');
  const [solicitanteId, setSolicitanteId] = useState('');
  const [obraId, setObraId] = useState('');
  const [lines, setLines] = useState<LinhaRecibo[]>(emptyLines());
  const [saved, setSaved] = useState(false);
  const [lastRecibo, setLastRecibo] = useState<typeof recibos[0] | null>(null);

  const filteredSolicitantes = useMemo(() => solicitantes.filter(s => s.clienteId === clienteId), [solicitantes, clienteId]);
  const filteredObras = useMemo(() => obras.filter(o => o.clienteId === clienteId), [obras, clienteId]);

  const total = lines.reduce((s, l) => s + l.total, 0);

  const nextNumber = useMemo(() => {
    const maxNum = recibos.reduce((max, rc) => {
      const n = parseInt(rc.number, 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    return String(maxNum + 1).padStart(4, '0');
  }, [recibos]);

  const updateLine = (idx: number, field: string, value: string | number) => {
    setLines(prev => {
      const next = [...prev];
      const line = { ...next[idx] };
      if (field === 'serviceCode') {
        const svc = servicos.find(s => s.code === value);
        line.serviceCode = value as string;
        line.description = svc?.description ?? '';
        line.unitPrice = svc?.unitPrice ?? 0;
        line.total = line.quantity * line.unitPrice;
      } else if (field === 'quantity') {
        line.quantity = Number(value) || 0;
        line.total = line.quantity * line.unitPrice;
      }
      next[idx] = line;
      return next;
    });
  };

  const handleSave = () => {
    if (!clienteId) { toast.error('Selecione um cliente.'); return; }
    const validLines = lines.filter(l => l.serviceCode && l.quantity > 0);
    if (validLines.length === 0) { toast.error('Adicione ao menos um serviço.'); return; }
    const recibo = addRecibo({
      date: new Date().toISOString().slice(0, 10),
      clienteId, solicitanteId, obraId,
      lines: validLines,
      total: validLines.reduce((s, l) => s + l.total, 0),
    });
    setLastRecibo(recibo);
    setSaved(true);
    toast.success(`Recibo Nº ${recibo.number} emitido com sucesso!`);
  };

  const handleNew = () => {
    setClienteId(''); setSolicitanteId(''); setObraId('');
    setLines(emptyLines()); setSaved(false); setLastRecibo(null);
  };

  const generatePdf = () => {
    const r = lastRecibo;
    if (!r) return;
    const doc = new jsPDF();
    const cliente = clientes.find(c => c.id === r.clienteId);
    const solicitante = solicitantes.find(s => s.id === r.solicitanteId);
    const obra = obras.find(o => o.id === r.obraId);

    doc.setFontSize(16);
    doc.text(empresaInfo.name, 14, 20);
    doc.setFontSize(9);
    doc.text(`CNPJ: ${empresaInfo.cnpj}`, 14, 27);
    doc.text(empresaInfo.address, 14, 32);
    doc.text(`Tel: ${empresaInfo.phone} | ${empresaInfo.email}`, 14, 37);

    doc.setFontSize(14);
    doc.text(`Recibo Nº ${r.number}`, 14, 50);
    doc.setFontSize(10);
    doc.text(`Data: ${formatDate(r.date)}`, 14, 57);
    if (cliente) doc.text(`Cliente: ${cliente.name} — CNPJ: ${cliente.cnpj}`, 14, 63);
    if (solicitante) doc.text(`Solicitante: ${solicitante.name}`, 14, 69);
    if (obra) doc.text(`Obra: ${obra.name}`, 14, 75);

    autoTable(doc, {
      startY: 82,
      head: [['Cód', 'Descrição', 'Qtd', 'Unitário', 'Total']],
      body: r.lines.map(l => [
        l.serviceCode,
        l.description,
        String(l.quantity),
        l.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        l.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      ]),
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? 120;
    doc.setFontSize(12);
    doc.text(`Total: ${r.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, finalY + 10);

    return doc;
  };

  const handleExportPdf = () => {
    const doc = generatePdf();
    if (doc) doc.save(`recibo_${lastRecibo!.number}.pdf`);
  };

  const handlePrint = () => {
    const doc = generatePdf();
    if (doc) {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const w = window.open(url);
      if (w) w.onload = () => { w.print(); URL.revokeObjectURL(url); };
    }
  };

  const servicoOptions = servicos.map(s => ({ value: s.code, label: `${s.code} - ${s.description}` }));

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-2 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Emissão de Recibo</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-primary">
              Nº {saved && lastRecibo ? lastRecibo.number : nextNumber}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatDate(new Date().toISOString().slice(0, 10))}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground">Cliente</label>
          <Combobox options={clientes.map(c => ({ value: c.id, label: c.name }))} value={clienteId} onValueChange={v => { setClienteId(v); setSolicitanteId(''); setObraId(''); }} placeholder="Selecione" disabled={saved} />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Solicitante</label>
          <Combobox options={filteredSolicitantes.map(s => ({ value: s.id, label: s.name }))} value={solicitanteId} onValueChange={setSolicitanteId} placeholder="Selecione" disabled={saved || !clienteId} />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Obra</label>
          <Combobox options={filteredObras.map(o => ({ value: o.id, label: o.name }))} value={obraId} onValueChange={setObraId} placeholder="Selecione" disabled={saved || !clienteId} />
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto flex-1 min-h-0">
        <Table>
          <TableHeader>
            <TableRow className="h-8">
              <TableHead className="py-1 text-xs w-[180px]">Serviço</TableHead>
              <TableHead className="py-1 text-xs">Descrição</TableHead>
              <TableHead className="py-1 text-xs w-[70px]">Qtd</TableHead>
              <TableHead className="py-1 text-xs w-[100px]">Unitário</TableHead>
              <TableHead className="py-1 text-xs w-[100px]">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line, idx) => (
              <TableRow key={idx} className="h-8">
                <TableCell className="py-0.5 px-2">
                  <Combobox options={servicoOptions} value={line.serviceCode} onValueChange={v => updateLine(idx, 'serviceCode', v)} placeholder="Código" disabled={saved} />
                </TableCell>
                <TableCell className="py-0.5 px-2 text-xs text-foreground">{line.description}</TableCell>
                <TableCell className="py-0.5 px-2">
                  <Input type="number" min={0} value={line.quantity || ''} onChange={e => updateLine(idx, 'quantity', e.target.value)} disabled={saved} className="h-7 w-16 text-base" />
                </TableCell>
                <TableCell className="py-0.5 px-2 text-xs text-foreground">
                  {line.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
                <TableCell className="py-0.5 px-2 text-xs font-medium text-foreground">
                  {line.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-1 gap-2">
        <p className="text-sm font-bold text-foreground">
          Total: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="min-h-[44px] sm:min-h-0" onClick={handleSave} disabled={saved}>Salvar Recibo</Button>
          <Button size="sm" variant="outline" className="min-h-[44px] sm:min-h-0" onClick={handleNew}>Novo Recibo</Button>
          {saved && <Button size="sm" variant="secondary" className="min-h-[44px] sm:min-h-0" onClick={handleExportPdf}>Exportar PDF</Button>}
          {saved && <Button size="sm" variant="secondary" className="min-h-[44px] sm:min-h-0" onClick={handlePrint}>Imprimir</Button>}
        </div>
      </div>
    </div>
  );
};

export default EmissaoReciboPage;
