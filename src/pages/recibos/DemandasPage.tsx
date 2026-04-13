import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, CalendarIcon, Search, Trash2, Edit, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import ThemeToggle from '@/components/ThemeToggle';

interface Demanda {
  id: string;
  cliente_id: string | null;
  cliente_nome: string;
  telefone: string;
  email: string;
  servico: string;
  prazo: string | null;
  responsavel_id: string | null;
  status: string;
  created_at: string;
}

interface Responsavel {
  id: string;
  name: string;
}

interface Cliente {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface Servico {
  id: string;
  description: string;
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  em_andamento: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  concluido: 'bg-green-500/15 text-green-700 dark:text-green-400',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
};

const DemandasPage = () => {
  const isMobile = useIsMobile();
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [clienteSearch, setClienteSearch] = useState('');
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [clienteNome, setClienteNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [servico, setServico] = useState('');
  const [prazo, setPrazo] = useState<Date | undefined>();
  const [responsavelId, setResponsavelId] = useState('');
  const [status, setStatus] = useState('pendente');

  // Mini-modal state
  const [newServicoOpen, setNewServicoOpen] = useState(false);
  const [newServicoName, setNewServicoName] = useState('');
  const [newResponsavelOpen, setNewResponsavelOpen] = useState(false);
  const [newResponsavelName, setNewResponsavelName] = useState('');

  // Client search
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);

  const filteredClientes = useMemo(() => {
    if (!clienteSearch.trim()) return clientes;
    return clientes.filter(c => c.name.toLowerCase().includes(clienteSearch.toLowerCase()));
  }, [clientes, clienteSearch]);

  const fetchAll = async () => {
    setLoading(true);
    const [dRes, rRes, cRes, sRes] = await Promise.all([
      supabase.from('demandas').select('*').order('created_at', { ascending: false }),
      supabase.from('responsaveis').select('*').order('name'),
      supabase.from('clientes').select('*').order('name'),
      supabase.from('servicos').select('id, description').order('description'),
    ]);
    if (dRes.data) setDemandas(dRes.data);
    if (rRes.data) setResponsaveis(rRes.data);
    if (cRes.data) setClientes(cRes.data);
    if (sRes.data) setServicos(sRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setClienteSearch('');
    setSelectedClienteId(null);
    setClienteNome('');
    setTelefone('');
    setEmail('');
    setServico('');
    setPrazo(undefined);
    setResponsavelId('');
    setStatus('pendente');
  };

  const openAdd = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (d: Demanda) => {
    setEditingId(d.id);
    setSelectedClienteId(d.cliente_id);
    setClienteNome(d.cliente_nome);
    setClienteSearch(d.cliente_nome);
    setTelefone(d.telefone);
    setEmail(d.email);
    setServico(d.servico);
    setPrazo(d.prazo ? new Date(d.prazo + 'T00:00:00') : undefined);
    setResponsavelId(d.responsavel_id || '');
    setStatus(d.status);
    setDialogOpen(true);
  };

  const handleSelectCliente = (c: Cliente) => {
    setSelectedClienteId(c.id);
    setClienteNome(c.name);
    setClienteSearch(c.name);
    setTelefone(c.phone);
    setEmail(c.email);
    setClientDropdownOpen(false);
  };

  const handleClienteAvulso = () => {
    setSelectedClienteId(null);
    setClienteNome(clienteSearch);
    setClientDropdownOpen(false);
  };

  const handleSave = async () => {
    const nome = clienteNome || clienteSearch;
    if (!nome.trim()) { toast.error('Informe o cliente'); return; }
    if (!servico) { toast.error('Selecione o serviço'); return; }

    const payload = {
      cliente_id: selectedClienteId,
      cliente_nome: nome,
      telefone,
      email,
      servico,
      prazo: prazo ? format(prazo, 'yyyy-MM-dd') : null,
      responsavel_id: responsavelId || null,
      status,
    };

    if (editingId) {
      const { error } = await supabase.from('demandas').update(payload).eq('id', editingId);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Demanda atualizada');
    } else {
      const { error } = await supabase.from('demandas').insert(payload);
      if (error) { toast.error('Erro ao salvar'); return; }
      toast.success('Demanda adicionada');
    }
    setDialogOpen(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('demandas').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Demanda excluída');
    fetchAll();
  };

  const addServico = async () => {
    if (!newServicoName.trim()) return;
    const { error } = await supabase.from('servicos').insert({ description: newServicoName.trim() });
    if (error) { toast.error('Erro ao adicionar serviço'); return; }
    toast.success('Serviço adicionado');
    setNewServicoName('');
    setNewServicoOpen(false);
    const { data } = await supabase.from('servicos').select('id, description').order('description');
    if (data) setServicos(data);
  };

  const addResponsavel = async () => {
    if (!newResponsavelName.trim()) return;
    const { error } = await supabase.from('responsaveis').insert({ name: newResponsavelName.trim() });
    if (error) { toast.error('Erro ao adicionar responsável'); return; }
    toast.success('Responsável adicionado');
    setNewResponsavelName('');
    setNewResponsavelOpen(false);
    const { data } = await supabase.from('responsaveis').select('*').order('name');
    if (data) setResponsaveis(data);
  };

  const getResponsavelName = (id: string | null) => responsaveis.find(r => r.id === id)?.name || '—';

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Demandas</h1>
        <Button onClick={openAdd} className="gap-2 min-h-[44px]">
          <Plus className="h-4 w-4" /> Adicionar Demanda
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <p className="text-muted-foreground text-sm p-4">Carregando...</p>
        ) : demandas.length === 0 ? (
          <p className="text-muted-foreground text-sm p-4">Nenhuma demanda cadastrada.</p>
        ) : isMobile ? (
          <div className="space-y-3">
            {demandas.map(d => (
              <div key={d.id} className="border border-border rounded-lg p-3 space-y-2 bg-card">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-foreground">{d.cliente_nome}</p>
                    <p className="text-xs text-muted-foreground">{d.servico}</p>
                  </div>
                  <Badge className={cn('text-xs', statusColors[d.status])}>{statusLabels[d.status] || d.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {d.telefone && <p>📞 {d.telefone}</p>}
                  {d.email && <p>✉️ {d.email}</p>}
                  {d.prazo && <p>📅 {format(new Date(d.prazo + 'T00:00:00'), 'dd/MM/yyyy')}</p>}
                  <p>👤 {getResponsavelName(d.responsavel_id)}</p>
                </div>
                <div className="flex gap-1 pt-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(d)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demandas.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.cliente_nome}</TableCell>
                  <TableCell>{d.telefone || '—'}</TableCell>
                  <TableCell>{d.email || '—'}</TableCell>
                  <TableCell>{d.servico}</TableCell>
                  <TableCell>{d.prazo ? format(new Date(d.prazo + 'T00:00:00'), 'dd/MM/yyyy') : '—'}</TableCell>
                  <TableCell>{getResponsavelName(d.responsavel_id)}</TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs', statusColors[d.status])}>{statusLabels[d.status] || d.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ScrollArea>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Demanda' : 'Nova Demanda'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Cliente search */}
            <div className="space-y-1">
              <Label>Cliente</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente ou digitar avulso..."
                  value={clienteSearch}
                  onChange={e => {
                    setClienteSearch(e.target.value);
                    setClientDropdownOpen(true);
                    setSelectedClienteId(null);
                    setClienteNome(e.target.value);
                  }}
                  onFocus={() => setClientDropdownOpen(true)}
                  className="pl-9 text-base"
                />
                {clientDropdownOpen && clienteSearch.trim() && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
                    {filteredClientes.map(c => (
                      <button
                        key={c.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                        onClick={() => handleSelectCliente(c)}
                      >
                        {c.name}
                      </button>
                    ))}
                    {filteredClientes.length === 0 && (
                      <button
                        className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
                        onClick={handleClienteAvulso}
                      >
                        Usar "{clienteSearch}" como cliente avulso
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label>Telefone</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} className="text-base" /></div>
              <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} className="text-base" /></div>
            </div>

            {/* Serviço + add */}
            <div className="space-y-1">
              <Label>Serviço</Label>
              <div className="flex gap-2">
                <Select value={servico} onValueChange={setServico}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {servicos.map(s => (
                      <SelectItem key={s.id} value={s.description}>{s.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={newServicoOpen} onOpenChange={setNewServicoOpen}>
                  <Button variant="outline" size="icon" className="shrink-0" onClick={() => setNewServicoOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <DialogContent className="sm:max-w-sm" onClick={e => e.stopPropagation()}>
                    <DialogHeader><DialogTitle>Novo Serviço</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <Input placeholder="Nome do serviço" value={newServicoName} onChange={e => setNewServicoName(e.target.value)} className="text-base" />
                      <Button className="w-full" onClick={addServico}>Salvar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Responsável + add */}
            <div className="space-y-1">
              <Label>Responsável</Label>
              <div className="flex gap-2">
                <Select value={responsavelId} onValueChange={setResponsavelId}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {responsaveis.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={newResponsavelOpen} onOpenChange={setNewResponsavelOpen}>
                  <Button variant="outline" size="icon" className="shrink-0" onClick={() => setNewResponsavelOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <DialogContent className="sm:max-w-sm" onClick={e => e.stopPropagation()}>
                    <DialogHeader><DialogTitle>Novo Responsável</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <Input placeholder="Nome do responsável" value={newResponsavelName} onChange={e => setNewResponsavelName(e.target.value)} className="text-base" />
                      <Button className="w-full" onClick={addResponsavel}>Salvar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Prazo */}
            <div className="space-y-1">
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !prazo && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {prazo ? format(prazo, 'dd/MM/yyyy') : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={prazo} onSelect={setPrazo} locale={ptBR} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* Status (only on edit) */}
            {editingId && (
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button className="w-full min-h-[44px]" onClick={handleSave}>
              {editingId ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemandasPage;
