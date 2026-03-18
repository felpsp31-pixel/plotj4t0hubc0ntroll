import { useState } from 'react';
import { useRecibos } from '@/contexts/RecibosContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Combobox from '@/components/recibos/Combobox';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const ClientesReciboPage = () => {
  const {
    clientes, addCliente, updateCliente, deleteCliente,
    solicitantes, addSolicitante, updateSolicitante, deleteSolicitante,
    obras, addObra, updateObra, deleteObra,
  } = useRecibos();

  const [cForm, setCForm] = useState({ name: '', cnpj: '', phone: '', email: '' });
  const [cEdit, setCEdit] = useState<string | null>(null);
  const [cEditData, setCEditData] = useState({ name: '', cnpj: '', phone: '', email: '' });

  const [sForm, setSForm] = useState({ clienteId: '', name: '', phone: '' });
  const [sEdit, setSEdit] = useState<string | null>(null);
  const [sEditData, setSEditData] = useState({ clienteId: '', name: '', phone: '' });

  const [oForm, setOForm] = useState({ clienteId: '', name: '' });
  const [oEdit, setOEdit] = useState<string | null>(null);
  const [oEditData, setOEditData] = useState({ clienteId: '', name: '' });

  const clienteOptions = clientes.map(c => ({ value: c.id, label: c.name }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Clientes, Solicitantes e Obras</h1>
      <Tabs defaultValue="clientes">
        <TabsList>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="solicitantes">Solicitantes</TabsTrigger>
          <TabsTrigger value="obras">Obras</TabsTrigger>
        </TabsList>

        {/* CLIENTES */}
        <TabsContent value="clientes" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <Input placeholder="Nome" value={cForm.name} onChange={e => setCForm(p => ({ ...p, name: e.target.value }))} className="text-base" />
            <Input placeholder="CNPJ" value={cForm.cnpj} onChange={e => setCForm(p => ({ ...p, cnpj: e.target.value }))} className="text-base" />
            <Input placeholder="Telefone" value={cForm.phone} onChange={e => setCForm(p => ({ ...p, phone: e.target.value }))} className="text-base" />
            <Input placeholder="Email" value={cForm.email} onChange={e => setCForm(p => ({ ...p, email: e.target.value }))} className="text-base" />
          </div>
          <Button size="sm" className="min-h-[44px] sm:min-h-0" onClick={() => { if (!cForm.name) { toast.error('Nome obrigatório'); return; } addCliente(cForm); setCForm({ name: '', cnpj: '', phone: '', email: '' }); toast.success('Cliente adicionado'); }}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>CNPJ</TableHead><TableHead>Telefone</TableHead><TableHead>Email</TableHead><TableHead className="w-24" /></TableRow></TableHeader>
              <TableBody>
                {clientes.map(c => (
                  <TableRow key={c.id}>
                    {cEdit === c.id ? (
                      <>
                        <TableCell><Input value={cEditData.name} onChange={e => setCEditData(p => ({ ...p, name: e.target.value }))} className="text-base" /></TableCell>
                        <TableCell><Input value={cEditData.cnpj} onChange={e => setCEditData(p => ({ ...p, cnpj: e.target.value }))} className="text-base" /></TableCell>
                        <TableCell><Input value={cEditData.phone} onChange={e => setCEditData(p => ({ ...p, phone: e.target.value }))} className="text-base" /></TableCell>
                        <TableCell><Input value={cEditData.email} onChange={e => setCEditData(p => ({ ...p, email: e.target.value }))} className="text-base" /></TableCell>
                        <TableCell className="flex gap-1">
                          <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => { updateCliente(c.id, cEditData); setCEdit(null); toast.success('Atualizado'); }}><Check className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => setCEdit(null)}><X className="h-4 w-4" /></Button>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-foreground">{c.name}</TableCell>
                        <TableCell className="text-foreground">{c.cnpj}</TableCell>
                        <TableCell className="text-foreground">{c.phone}</TableCell>
                        <TableCell className="text-foreground">{c.email}</TableCell>
                        <TableCell className="flex gap-1">
                          <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => { setCEdit(c.id); setCEditData({ name: c.name, cnpj: c.cnpj, phone: c.phone, email: c.email }); }}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => { deleteCliente(c.id); toast.success('Removido'); }}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* SOLICITANTES */}
        <TabsContent value="solicitantes" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Combobox options={clienteOptions} value={sForm.clienteId} onValueChange={v => setSForm(p => ({ ...p, clienteId: v }))} placeholder="Cliente" />
            <Input placeholder="Nome" value={sForm.name} onChange={e => setSForm(p => ({ ...p, name: e.target.value }))} className="text-base" />
            <Input placeholder="Telefone" value={sForm.phone} onChange={e => setSForm(p => ({ ...p, phone: e.target.value }))} className="text-base" />
          </div>
          <Button size="sm" className="min-h-[44px] sm:min-h-0" onClick={() => { if (!sForm.clienteId || !sForm.name) { toast.error('Preencha cliente e nome'); return; } addSolicitante(sForm); setSForm({ clienteId: '', name: '', phone: '' }); toast.success('Solicitante adicionado'); }}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Nome</TableHead><TableHead>Telefone</TableHead><TableHead className="w-24" /></TableRow></TableHeader>
              <TableBody>
                {solicitantes.map(s => {
                  const clienteName = clientes.find(c => c.id === s.clienteId)?.name ?? '—';
                  return (
                    <TableRow key={s.id}>
                      {sEdit === s.id ? (
                        <>
                          <TableCell><Combobox options={clienteOptions} value={sEditData.clienteId} onValueChange={v => setSEditData(p => ({ ...p, clienteId: v }))} placeholder="Cliente" /></TableCell>
                          <TableCell><Input value={sEditData.name} onChange={e => setSEditData(p => ({ ...p, name: e.target.value }))} className="text-base" /></TableCell>
                          <TableCell><Input value={sEditData.phone} onChange={e => setSEditData(p => ({ ...p, phone: e.target.value }))} className="text-base" /></TableCell>
                          <TableCell className="flex gap-1">
                            <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => { updateSolicitante(s.id, sEditData); setSEdit(null); toast.success('Atualizado'); }}><Check className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => setSEdit(null)}><X className="h-4 w-4" /></Button>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-foreground">{clienteName}</TableCell>
                          <TableCell className="text-foreground">{s.name}</TableCell>
                          <TableCell className="text-foreground">{s.phone}</TableCell>
                          <TableCell className="flex gap-1">
                            <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => { setSEdit(s.id); setSEditData({ clienteId: s.clienteId, name: s.name, phone: s.phone }); }}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => { deleteSolicitante(s.id); toast.success('Removido'); }}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* OBRAS */}
        <TabsContent value="obras" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Combobox options={clienteOptions} value={oForm.clienteId} onValueChange={v => setOForm(p => ({ ...p, clienteId: v }))} placeholder="Cliente" />
            <Input placeholder="Nome da obra" value={oForm.name} onChange={e => setOForm(p => ({ ...p, name: e.target.value }))} className="text-base" />
          </div>
          <Button size="sm" className="min-h-[44px] sm:min-h-0" onClick={() => { if (!oForm.clienteId || !oForm.name) { toast.error('Preencha cliente e nome'); return; } addObra(oForm); setOForm({ clienteId: '', name: '' }); toast.success('Obra adicionada'); }}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Obra</TableHead><TableHead className="w-24" /></TableRow></TableHeader>
              <TableBody>
                {obras.map(o => {
                  const clienteName = clientes.find(c => c.id === o.clienteId)?.name ?? '—';
                  return (
                    <TableRow key={o.id}>
                      {oEdit === o.id ? (
                        <>
                          <TableCell><Combobox options={clienteOptions} value={oEditData.clienteId} onValueChange={v => setOEditData(p => ({ ...p, clienteId: v }))} placeholder="Cliente" /></TableCell>
                          <TableCell><Input value={oEditData.name} onChange={e => setOEditData(p => ({ ...p, name: e.target.value }))} className="text-base" /></TableCell>
                          <TableCell className="flex gap-1">
                            <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => { updateObra(o.id, oEditData); setOEdit(null); toast.success('Atualizado'); }}><Check className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => setOEdit(null)}><X className="h-4 w-4" /></Button>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-foreground">{clienteName}</TableCell>
                          <TableCell className="text-foreground">{o.name}</TableCell>
                          <TableCell className="flex gap-1">
                            <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => { setOEdit(o.id); setOEditData({ clienteId: o.clienteId, name: o.name }); }}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => { deleteObra(o.id); toast.success('Removida'); }}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientesReciboPage;
