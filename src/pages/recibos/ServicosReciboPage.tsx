import { useState } from 'react';
import { useRecibos } from '@/contexts/RecibosContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const ServicosReciboPage = () => {
  const { servicos, addServico, updateServico, deleteServico } = useRecibos();
  const [form, setForm] = useState({ code: '', description: '', unitPrice: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ code: '', description: '', unitPrice: '' });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
      <div className="flex gap-2 items-end flex-wrap">
        <Input placeholder="Código" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className="w-28" />
        <Input placeholder="Descrição" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-60" />
        <Input placeholder="Valor unitário" type="number" value={form.unitPrice} onChange={e => setForm(p => ({ ...p, unitPrice: e.target.value }))} className="w-36" />
        <Button size="sm" onClick={() => {
          if (!form.code || !form.description) { toast.error('Preencha código e descrição'); return; }
          addServico({ code: form.code, description: form.description, unitPrice: Number(form.unitPrice) || 0 });
          setForm({ code: '', description: '', unitPrice: '' });
          toast.success('Serviço adicionado');
        }}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Código</TableHead><TableHead>Descrição</TableHead><TableHead>Valor Unitário</TableHead><TableHead className="w-24" /></TableRow>
        </TableHeader>
        <TableBody>
          {servicos.map(s => (
            <TableRow key={s.id}>
              {editId === s.id ? (
                <>
                  <TableCell><Input value={editData.code} onChange={e => setEditData(p => ({ ...p, code: e.target.value }))} /></TableCell>
                  <TableCell><Input value={editData.description} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} /></TableCell>
                  <TableCell><Input type="number" value={editData.unitPrice} onChange={e => setEditData(p => ({ ...p, unitPrice: e.target.value }))} /></TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { updateServico(s.id, { code: editData.code, description: editData.description, unitPrice: Number(editData.unitPrice) || 0 }); setEditId(null); toast.success('Atualizado'); }}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditId(null)}><X className="h-4 w-4" /></Button>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="text-foreground">{s.code}</TableCell>
                  <TableCell className="text-foreground">{s.description}</TableCell>
                  <TableCell className="text-foreground">{s.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditId(s.id); setEditData({ code: s.code, description: s.description, unitPrice: String(s.unitPrice) }); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { deleteServico(s.id); toast.success('Removido'); }}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ServicosReciboPage;
