import { useState } from 'react';
import { useRecibos } from '@/contexts/RecibosContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const ServicosReciboPage = () => {
  const { servicos, addServico, updateServico, deleteServico, loading } = useRecibos();
  const [form, setForm] = useState({ code: '', description: '', unitPrice: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ code: '', description: '', unitPrice: '' });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end flex-wrap">
        <Input placeholder="Código" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className="w-full sm:w-28 text-base" />
        <Input placeholder="Descrição" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full sm:w-60 text-base" />
        <Input placeholder="Valor unitário" type="number" value={form.unitPrice} onChange={e => setForm(p => ({ ...p, unitPrice: e.target.value }))} className="w-full sm:w-36 text-base" />
        <Button size="sm" className="min-h-[44px] sm:min-h-0" onClick={() => {
          if (!form.code || !form.description) { toast.error('Preencha código e descrição'); return; }
          addServico({ code: form.code, description: form.description, unitPrice: Number(form.unitPrice) || 0 });
          setForm({ code: '', description: '', unitPrice: '' });
          toast.success('Serviço adicionado');
        }}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Código</TableHead><TableHead>Descrição</TableHead><TableHead>Valor Unitário</TableHead><TableHead className="w-24" /></TableRow>
          </TableHeader>
          <TableBody>
            {servicos.map(s => (
              <TableRow key={s.id}>
                {editId === s.id ? (
                  <>
                    <TableCell><Input value={editData.code} onChange={e => setEditData(p => ({ ...p, code: e.target.value }))} className="text-base" /></TableCell>
                    <TableCell><Input value={editData.description} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} className="text-base" /></TableCell>
                    <TableCell><Input type="number" value={editData.unitPrice} onChange={e => setEditData(p => ({ ...p, unitPrice: e.target.value }))} className="text-base" /></TableCell>
                    <TableCell className="flex gap-1">
                      <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => { updateServico(s.id, { code: editData.code, description: editData.description, unitPrice: Number(editData.unitPrice) || 0 }); setEditId(null); toast.success('Atualizado'); }}><Check className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => setEditId(null)}><X className="h-4 w-4" /></Button>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="text-foreground">{s.code}</TableCell>
                    <TableCell className="text-foreground">{s.description}</TableCell>
                    <TableCell className="text-foreground">{s.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => { setEditId(s.id); setEditData({ code: s.code, description: s.description, unitPrice: String(s.unitPrice) }); }}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => { deleteServico(s.id); toast.success('Removido'); }}>Confirmar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ServicosReciboPage;
