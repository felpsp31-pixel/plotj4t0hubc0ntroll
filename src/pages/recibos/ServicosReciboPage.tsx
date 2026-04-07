import { useState, useMemo } from 'react';
import { useRecibos } from '@/contexts/RecibosContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Combobox from '@/components/recibos/Combobox';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const DeleteButton = ({ onConfirm }: { onConfirm: () => void }) => (
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
        <AlertDialogAction onClick={onConfirm}>Confirmar</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const ServicosReciboPage = () => {
  const {
    servicos, addServico, updateServico, deleteServico,
    clientes, clientServices, addClientService, updateClientService, deleteClientService,
    loading,
  } = useRecibos();

  // Global services state
  const [form, setForm] = useState({ code: '', description: '', unitPrice: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ code: '', description: '', unitPrice: '' });

  // Client services state
  const [csFilterClienteId, setCsFilterClienteId] = useState('');
  const [csForm, setCsForm] = useState({ clienteId: '', code: '', description: '', unitPrice: 0 });
  const [csEdit, setCsEdit] = useState<string | null>(null);
  const [csEditData, setCsEditData] = useState({ code: '', description: '', unitPrice: 0 });

  const clienteOptions = clientes.map(c => ({ value: c.id, label: c.name }));

  const filteredClientServices = useMemo(() =>
    csFilterClienteId ? clientServices.filter(cs => cs.clienteId === csFilterClienteId) : clientServices,
    [clientServices, csFilterClienteId]
  );

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
      <Tabs defaultValue="globais">
        <TabsList>
          <TabsTrigger value="globais">Serviços Globais</TabsTrigger>
          <TabsTrigger value="cliente">Serviços por Cliente</TabsTrigger>
        </TabsList>

        {/* SERVIÇOS GLOBAIS */}
        <TabsContent value="globais" className="space-y-4">
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
                          <DeleteButton onConfirm={() => { deleteServico(s.id); toast.success('Removido'); }} />
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* SERVIÇOS POR CLIENTE */}
        <TabsContent value="cliente" className="space-y-4">
          <p className="text-sm text-muted-foreground">Cadastre serviços com valores específicos para cada cliente. Eles aparecerão na emissão de recibo junto aos serviços globais.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <Combobox options={clienteOptions} value={csForm.clienteId} onValueChange={v => setCsForm(p => ({ ...p, clienteId: v }))} placeholder="Cliente" />
            <Input placeholder="Código" value={csForm.code} onChange={e => setCsForm(p => ({ ...p, code: e.target.value }))} className="text-base" />
            <Input placeholder="Descrição" value={csForm.description} onChange={e => setCsForm(p => ({ ...p, description: e.target.value }))} className="text-base" />
            <Input type="number" min={0} step="0.01" placeholder="Valor unitário" value={csForm.unitPrice || ''} onChange={e => setCsForm(p => ({ ...p, unitPrice: Number(e.target.value) || 0 }))} className="text-base" />
          </div>
          <Button size="sm" className="min-h-[44px] sm:min-h-0" onClick={() => {
            if (!csForm.clienteId || !csForm.code || !csForm.description) { toast.error('Preencha cliente, código e descrição'); return; }
            addClientService(csForm);
            setCsForm({ clienteId: '', code: '', description: '', unitPrice: 0 });
            toast.success('Serviço do cliente adicionado');
          }}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtrar por cliente:</span>
            <div className="w-64">
              <Combobox
                options={[{ value: '', label: 'Todos' }, ...clienteOptions]}
                value={csFilterClienteId}
                onValueChange={setCsFilterClienteId}
                placeholder="Todos"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor Unit.</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientServices.map(cs => {
                  const clienteName = clientes.find(c => c.id === cs.clienteId)?.name ?? '—';
                  return (
                    <TableRow key={cs.id}>
                      {csEdit === cs.id ? (
                        <>
                          <TableCell className="text-foreground">{clienteName}</TableCell>
                          <TableCell><Input value={csEditData.code} onChange={e => setCsEditData(p => ({ ...p, code: e.target.value }))} className="text-base" /></TableCell>
                          <TableCell><Input value={csEditData.description} onChange={e => setCsEditData(p => ({ ...p, description: e.target.value }))} className="text-base" /></TableCell>
                          <TableCell><Input type="number" min={0} step="0.01" value={csEditData.unitPrice || ''} onChange={e => setCsEditData(p => ({ ...p, unitPrice: Number(e.target.value) || 0 }))} className="text-base w-24" /></TableCell>
                          <TableCell className="flex gap-1">
                            <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => { updateClientService(cs.id, csEditData); setCsEdit(null); toast.success('Atualizado'); }}><Check className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => setCsEdit(null)}><X className="h-4 w-4" /></Button>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-foreground">{clienteName}</TableCell>
                          <TableCell className="text-foreground">{cs.code}</TableCell>
                          <TableCell className="text-foreground">{cs.description}</TableCell>
                          <TableCell className="text-foreground">{cs.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                          <TableCell className="flex gap-1">
                            <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => { setCsEdit(cs.id); setCsEditData({ code: cs.code, description: cs.description, unitPrice: cs.unitPrice }); }}><Pencil className="h-4 w-4" /></Button>
                            <DeleteButton onConfirm={() => { deleteClientService(cs.id); toast.success('Removido'); }} />
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
                {filteredClientServices.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum serviço específico cadastrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServicosReciboPage;
