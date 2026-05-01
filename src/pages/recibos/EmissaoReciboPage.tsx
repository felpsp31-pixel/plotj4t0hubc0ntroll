import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRecibos } from '@/contexts/RecibosContext';
import Combobox from '@/components/recibos/Combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import type { LinhaRecibo } from '@/types/recibos';

const formatDate = (date: string) => {
  if (!date) return '—';
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
};

const emptyLines = (): LinhaRecibo[] =>
  Array.from({ length: 10 }, () => ({ serviceCode: '', description: '', quantity: 0, unitPrice: 0, total: 0 }));

const EmissaoReciboPage = () => {
  const location = useLocation();
  const { clientes, solicitantes, obras, servicos, clientServices, recibos, addRecibo, empresaInfo, loading } = useRecibos();
  const [clienteId, setClienteId] = useState('');
  const [clienteAvulso, setClienteAvulso] = useState('');
  const [clienteSearch, setClienteSearch] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [solicitanteId, setSolicitanteId] = useState('');
  const [obraId, setObraId] = useState('');
  const [lines, setLines] = useState<LinhaRecibo[]>(emptyLines());
  const [saved, setSaved] = useState(false);
  const [lastRecibo, setLastRecibo] = useState<typeof recibos[0] | null>(null);
  const [isPago, setIsPago] = useState(false);
  const demandaIdRef = useRef<string | null>(null);

  // Auto-fill client from demandas navigation
  useEffect(() => {
    const state = location.state as { clienteNome?: string; clienteId?: string | null; isAvulso?: boolean; obraId?: string | null; solicitanteId?: string | null; demandaId?: string | null } | null;
    if (!state?.clienteNome) return;
    if (state.demandaId) demandaIdRef.current = state.demandaId;
    if (state.clienteId && !state.isAvulso) {
      setClienteId(state.clienteId);
      setClienteSearch(state.clienteNome);
      setClienteAvulso('');
      setIsPago(false);
      if (state.obraId) setObraId(state.obraId);
      if (state.solicitanteId) setSolicitanteId(state.solicitanteId);
    } else {
      setClienteId('');
      setClienteAvulso(state.clienteNome);
      setClienteSearch(state.clienteNome);
      setIsPago(true);
    }
    window.history.replaceState({}, document.title);
  }, [location.state]);

  const filteredClienteOptions = useMemo(() => {
    if (!clienteSearch.trim()) return clientes;
    return clientes.filter(c => c.name.toLowerCase().includes(clienteSearch.toLowerCase()));
  }, [clientes, clienteSearch]);

  const filteredSolicitantes = useMemo(() => solicitantes.filter(s => s.clienteId === clienteId), [solicitantes, clienteId]);
  const filteredObras = useMemo(() => obras.filter(o => o.clienteId === clienteId), [obras, clienteId]);

  // Auto-insert/remove delivery line when obra changes or subtotal crosses exemption threshold
  useEffect(() => {
    if (saved) return;
    const obra = obras.find(o => o.id === obraId);
    setLines(prev => {
      // Remove any existing delivery line
      const withoutDelivery = prev.filter(l => l.serviceCode !== 'ENTREGA');
      
      // Calculate subtotal without delivery
      const subtotal = withoutDelivery.reduce((s, l) => s + l.total, 0);
      
      const shouldAddDelivery = obra?.hasDelivery && obra.deliveryValue > 0 &&
        !(obra.exemptionValue > 0 && subtotal >= obra.exemptionValue);
      
      if (shouldAddDelivery) {
        const lastFilledIdx = withoutDelivery.reduce((last, l, i) => l.serviceCode ? i : last, -1);
        const insertIdx = lastFilledIdx + 1;
        const deliveryLine: LinhaRecibo = {
          serviceCode: 'ENTREGA',
          description: 'Entrega',
          quantity: 1,
          unitPrice: obra.deliveryValue,
          total: obra.deliveryValue,
        };
        const result = [...withoutDelivery];
        result.splice(insertIdx, 0, deliveryLine);
        while (result.length < 10) result.push({ serviceCode: '', description: '', quantity: 0, unitPrice: 0, total: 0 });
        return result;
      }
      // Ensure at least 10 lines
      while (withoutDelivery.length < 10) withoutDelivery.push({ serviceCode: '', description: '', quantity: 0, unitPrice: 0, total: 0 });
      return withoutDelivery;
    });
  }, [obraId, obras, saved]);

  // Subtotal without delivery for exemption check
  const subtotalWithoutDelivery = useMemo(() =>
    lines.filter(l => l.serviceCode !== 'ENTREGA').reduce((s, l) => s + l.total, 0),
  [lines]);

  // Check exemption threshold when lines change
  useEffect(() => {
    if (saved || !obraId) return;
    const obra = obras.find(o => o.id === obraId);
    if (!obra?.hasDelivery || !obra.exemptionValue || obra.exemptionValue <= 0) return;
    
    const hasDeliveryLine = lines.some(l => l.serviceCode === 'ENTREGA');
    
    if (subtotalWithoutDelivery >= obra.exemptionValue && hasDeliveryLine) {
      setLines(prev => {
        const without = prev.filter(l => l.serviceCode !== 'ENTREGA');
        while (without.length < 10) without.push({ serviceCode: '', description: '', quantity: 0, unitPrice: 0, total: 0 });
        return without;
      });
    } else if (subtotalWithoutDelivery < obra.exemptionValue && !hasDeliveryLine && obra.deliveryValue > 0) {
      setLines(prev => {
        const without = prev.filter(l => l.serviceCode !== 'ENTREGA');
        const lastFilledIdx = without.reduce((last, l, i) => l.serviceCode ? i : last, -1);
        const deliveryLine: LinhaRecibo = {
          serviceCode: 'ENTREGA', description: 'Entrega', quantity: 1,
          unitPrice: obra.deliveryValue, total: obra.deliveryValue,
        };
        const result = [...without];
        result.splice(lastFilledIdx + 1, 0, deliveryLine);
        while (result.length < 10) result.push({ serviceCode: '', description: '', quantity: 0, unitPrice: 0, total: 0 });
        return result;
      });
    }
  }, [subtotalWithoutDelivery, obraId, obras, saved]);

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
        const val = value as string;
        if (val.startsWith('CS:')) {
          const csCode = val.slice(3);
          const cs = clientSpecificServices.find(s => s.code === csCode);
          line.serviceCode = val;
          line.description = cs?.description ?? '';
          line.unitPrice = cs?.unitPrice ?? 0;
        } else {
          const svc = servicos.find(s => s.code === val);
          line.serviceCode = val;
          line.description = svc?.description ?? '';
          line.unitPrice = svc?.unitPrice ?? 0;
        }
        line.total = line.quantity * line.unitPrice;
      } else if (field === 'quantity') {
        line.quantity = Number(value) || 0;
        line.total = line.quantity * line.unitPrice;
      }
      next[idx] = line;
      return next;
    });
  };

  const handleSave = async () => {
    if (!clienteId && !clienteAvulso.trim()) { toast.error('Selecione ou digite um cliente.'); return; }
    const validLines = lines.filter(l => l.serviceCode && l.quantity > 0);
    if (validLines.length === 0) { toast.error('Adicione ao menos um serviço.'); return; }
    const total = validLines.reduce((s, l) => s + l.total, 0);
    const recibo = addRecibo({
      date: new Date().toISOString().slice(0, 10),
      clienteId: clienteId || '',
      clienteAvulso: clienteId ? undefined : clienteAvulso.trim(),
      solicitanteId, obraId,
      lines: validLines,
      total,
    });
    setLastRecibo(recibo);
    setSaved(true);
    toast.success(`Recibo Nº ${recibo.number} emitido com sucesso!`);

    // Update demanda with recibo value if linked
    if (demandaIdRef.current) {
      await supabase.from('demandas').update({ valor_recibo: total } as any).eq('id', demandaIdRef.current);
      demandaIdRef.current = null;
    }
  };

  const handleNew = () => {
    setClienteId(''); setClienteAvulso(''); setClienteSearch(''); setSolicitanteId(''); setObraId('');
    setLines(emptyLines()); setSaved(false); setLastRecibo(null); setIsPago(false);
  };

  const generatePdf = async () => {
    const r = lastRecibo;
    if (!r) return;
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const doc = new jsPDF();
    const cliente = clientes.find(c => c.id === r.clienteId);
    const solicitante = solicitantes.find(s => s.id === r.solicitanteId);
    const obra = obras.find(o => o.id === r.obraId);

    // Logo no canto superior direito (se configurada)
    if (empresaInfo.logo && empresaInfo.logo.startsWith('data:image/')) {
      try {
        const mimeMatch = empresaInfo.logo.match(/^data:image\/([a-zA-Z]+)/);
        const ext = (mimeMatch?.[1] || 'png').toLowerCase();
        const fmt = ext === 'jpg' || ext === 'jpeg' ? 'JPEG' : ext === 'webp' ? 'WEBP' : 'PNG';
        const img = new Image();
        img.src = empresaInfo.logo;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('logo load failed'));
        });
        const maxW = 40, maxH = 22;
        const ratio = Math.min(maxW / img.width, maxH / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        const pageW = doc.internal.pageSize.getWidth();
        doc.addImage(empresaInfo.logo, fmt, pageW - w - 14, 12, w, h);
      } catch (e) {
        console.warn('Falha ao adicionar logo ao PDF:', e);
      }
    }

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
    const clienteName = cliente?.name || r.clienteAvulso || 'Cliente Avulso';
    const clienteCnpj = cliente?.cnpj;
    doc.text(`Cliente: ${clienteName}${clienteCnpj ? ` — CNPJ: ${clienteCnpj}` : ''}`, 14, 63);
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

    if (isPago) {
      // "PAGO" stamp in red
      doc.setFontSize(36);
      doc.setTextColor(220, 38, 38);
      doc.text('PAGO', 140, finalY + 15);
      doc.setTextColor(0, 0, 0);
    } else {
      // Signature line
      const signY = finalY + 30;
      doc.setFontSize(10);
      doc.text('Ass:', 14, signY);
      doc.line(30, signY, 120, signY);
    }

    return doc;
  };

  const handleExportPdf = async () => {
    const doc = await generatePdf();
    if (doc) doc.save(`recibo_${lastRecibo!.number}.pdf`);
  };

  const handlePrint = async () => {
    const doc = await generatePdf();
    if (doc) {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const w = window.open(url);
      if (w) w.onload = () => { w.print(); URL.revokeObjectURL(url); };
    }
  };

  const clientSpecificServices = useMemo(() =>
    clientServices.filter(cs => cs.clienteId === clienteId), [clientServices, clienteId]);

  const servicoOptions = useMemo(() => {
    const global = servicos.map(s => ({ value: s.code, label: `${s.code} - ${s.description}` }));
    const specific = clientSpecificServices.map(cs => ({ value: `CS:${cs.code}`, label: `★ ${cs.code} - ${cs.description}` }));
    return [...specific, ...global];
  }, [servicos, clientSpecificServices]);

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
        <div className="relative">
          <label className="text-xs font-medium text-foreground">Cliente</label>
          <Input
            placeholder="Buscar ou digitar cliente avulso..."
            value={clienteSearch}
            onChange={e => {
              setClienteSearch(e.target.value);
              setClientDropdownOpen(true);
              // If typed text doesn't match a selected client, treat as avulso
              setClienteAvulso(e.target.value);
              setClienteId('');
              setSolicitanteId('');
              setObraId('');
            }}
            onFocus={() => setClientDropdownOpen(true)}
            onBlur={() => setTimeout(() => setClientDropdownOpen(false), 200)}
            disabled={saved}
            className="h-7 text-xs"
          />
          {clientDropdownOpen && clienteSearch.trim() && !saved && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
              {filteredClienteOptions.map(c => (
                <button
                  key={c.id}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    setClienteId(c.id);
                    setClienteAvulso('');
                    setClienteSearch(c.name);
                    setClientDropdownOpen(false);
                    setSolicitanteId('');
                    setObraId('');
                  }}
                >
                  {c.name}
                </button>
              ))}
              {filteredClienteOptions.length === 0 && (
                <div className="px-3 py-1.5 text-xs text-muted-foreground">
                  Usar "{clienteSearch}" como avulso
                </div>
              )}
            </div>
          )}
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
        <div className="flex items-center gap-4">
          <p className="text-sm font-bold text-foreground">
            Total: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <Checkbox checked={isPago} onCheckedChange={(v) => setIsPago(!!v)} disabled={saved} />
            Pago
          </label>
        </div>
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
