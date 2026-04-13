import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, CalendarIcon, Search, Trash2, Edit, ArrowLeft, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
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
  prioridade: string;
  canal: string;
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

const prioridadeColors: Record<string, string> = {
  baixa: 'bg-green-500/15 text-green-700 dark:text-green-400',
  media: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  alta: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  urgente: 'bg-red-500/15 text-red-700 dark:text-red-400',
};

const prioridadeLabels: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

const canalOptions = ['WhatsApp', 'Email', 'Telefone', 'Presencial'];

const DemandasPage = () => {
  const navigate = useNavigate();
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
  const [prazoHora, setPrazoHora] = useState('12:00');
  const [responsavelId, setResponsavelId] = useState('');
  const [status, setStatus] = useState('pendente');
  const [prioridade, setPrioridade] = useState('media');
  const [canal, setCanal] = useState('');

  // Mini-modal state
  const [newServicoOpen, setNewServicoOpen] = useState(false);
  const [newServicoName, setNewServicoName] = useState('');
  const [newResponsavelOpen, setNewResponsavelOpen] = useState(false);
  const [newResponsavelName, setNewResponsavelName] = useState('');

  // Client search
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);

  // Confirm complete dialog
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [confirmCompleteId, setConfirmCompleteId] = useState<string | null>(null);

  // Post-completion recibo dialog
  const [showReciboButton, setShowReciboButton] = useState(false);
  const [completedDemandaCliente, setCompletedDemandaCliente] = useState<string | null>(null);

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
    setPrazoHora('12:00');
    setResponsavelId('');
    setStatus('pendente');
    setPrioridade('media');
    setCanal('');
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
    if (d.prazo) {
      const dt = new Date(d.prazo);
      setPrazo(dt);
      setPrazoHora(format(dt, 'HH:mm'));
    } else {
      setPrazo(undefined);
      setPrazoHora('12:00');
    }
    setResponsavelId(d.responsavel_id || '');
    setStatus(d.status);
    setPrioridade(d.prioridade || 'media');
    setCanal(d.canal || '');
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

    let prazoISO: string | null = null;
    if (prazo) {
      const [hh, mm] = prazoHora.split(':').map(Number);
      const dt = new Date(prazo);
      dt.setHours(hh, mm, 0, 0);
      prazoISO = dt.toISOString();
    }

    const payload = {
      cliente_id: selectedClienteId,
      cliente_nome: nome,
      telefone,
      email,
      servico,
      prazo: prazoISO,
      responsavel_id: responsavelId || null,
      status,
      prioridade,
      canal,
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

  const getDeadlineAlert = (prazo: string | null, status: string) => {
    if (!prazo || status === 'concluido') return null;
    const now = new Date();
    const deadline = new Date(prazo);
    const diffMs = deadline.getTime() - now.getTime();
    if (diffMs < 0) return 'overdue';
    if (diffMs <= 60 * 60 * 1000) return 'warning';
    return null;
  };

  const getRowClass = (d: Demanda) => {
    const alert = getDeadlineAlert(d.prazo, d.status);
    if (alert === 'overdue') return 'bg-red-500/10 border-l-4 border-l-red-500';
    if (alert === 'warning') return 'bg-yellow-500/10 border-l-4 border-l-yellow-500';
    return '';
  };

  const handleConfirmComplete = async () => {
    if (!confirmCompleteId) return;
    const demanda = demandas.find(d => d.id === confirmCompleteId);
    const { error } = await supabase.from('demandas').update({ status: 'concluido' }).eq('id', confirmCompleteId);
    if (error) { toast.error('Erro ao concluir'); return; }
    toast.success('Demanda concluída!');
    setConfirmCompleteOpen(false);
    setConfirmCompleteId(null);
    setCompletedDemandaCliente(demanda?.cliente_nome || null);
    setShowReciboButton(true);
    fetchAll();
  };

  return (
    <div className="h-screen flex flex-col bg-background p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="min-h-[44px] min-w-[44px]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Demandas</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle expanded={false} />
          <Button onClick={openAdd} className="gap-2 min-h-[44px]">
            <Plus className="h-4 w-4" /> Adicionar Demanda
          </Button>
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden gap-4">

      <ScrollArea className="flex-1">
        {loading ? (
          <p className="text-muted-foreground text-sm p-4">Carregando...</p>
        ) : demandas.length === 0 ? (
          <p className="text-muted-foreground text-sm p-4">Nenhuma demanda cadastrada.</p>
        ) : isMobile ? (
          <div className="space-y-3">
            {demandas.map(d => {
              const alert = getDeadlineAlert(d.prazo, d.status);
              return (
              <div key={d.id} className={cn("border border-border rounded-lg p-3 space-y-2 bg-card", getRowClass(d))}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {d.status !== 'concluido' && (
                      <button onClick={() => { setConfirmCompleteId(d.id); setConfirmCompleteOpen(true); }} className="text-muted-foreground hover:text-green-600 transition-colors">
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{d.cliente_nome}</p>
                      <p className="text-xs text-muted-foreground">{d.servico}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {alert && <AlertTriangle className={cn("h-4 w-4", alert === 'overdue' ? 'text-red-500' : 'text-yellow-500')} />}
                    <Badge className={cn('text-xs', statusColors[d.status])}>{statusLabels[d.status] || d.status}</Badge>
                    <Badge className={cn('text-xs', prioridadeColors[d.prioridade])}>{prioridadeLabels[d.prioridade] || d.prioridade}</Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {d.telefone && <p>📞 {d.telefone}</p>}
                  {d.email && <p>✉️ {d.email}</p>}
                  {d.prazo && <p>📅 {format(new Date(d.prazo), 'dd/MM/yyyy HH:mm')}</p>}
                  <p>👤 {getResponsavelName(d.responsavel_id)}</p>
                  {d.canal && <p>📢 {d.canal}</p>}
                </div>
                <div className="flex gap-1 pt-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(d)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              );
            })}
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
                <TableHead>Prioridade</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demandas.map(d => {
                const alert = getDeadlineAlert(d.prazo, d.status);
                return (
                <TableRow key={d.id} className={getRowClass(d)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {d.status !== 'concluido' && (
                        <button onClick={() => { setConfirmCompleteId(d.id); setConfirmCompleteOpen(true); }} className="text-muted-foreground hover:text-green-600 transition-colors" title="Concluir tarefa">
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                      )}
                      {d.status === 'concluido' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      {d.cliente_nome}
                    </div>
                  </TableCell>
                  <TableCell>{d.telefone || '—'}</TableCell>
                  <TableCell>{d.email || '—'}</TableCell>
                  <TableCell>{d.servico}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {alert && <AlertTriangle className={cn("h-4 w-4 shrink-0", alert === 'overdue' ? 'text-red-500' : 'text-yellow-500')} />}
                      {d.prazo ? format(new Date(d.prazo), 'dd/MM/yyyy HH:mm') : '—'}
                    </div>
                  </TableCell>
                  <TableCell>{getResponsavelName(d.responsavel_id)}</TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs', statusColors[d.status])}>{statusLabels[d.status] || d.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs', prioridadeColors[d.prioridade])}>{prioridadeLabels[d.prioridade] || d.prioridade}</Badge>
                  </TableCell>
                  <TableCell>{d.canal || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
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
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('flex-1 justify-start text-left font-normal', !prazo && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {prazo ? format(prazo, 'dd/MM/yyyy') : 'Data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={prazo} onSelect={setPrazo} locale={ptBR} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Input type="time" value={prazoHora} onChange={e => setPrazoHora(e.target.value)} className="w-28 text-base" />
              </div>
            </div>

            {/* Status */}
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

            {/* Prioridade */}
            <div className="space-y-1">
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Canal */}
            <div className="space-y-1">
              <Label>Canal</Label>
              <Select value={canal} onValueChange={setCanal}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {canalOptions.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full min-h-[44px]" onClick={handleSave}>
              {editingId ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Complete Dialog */}
      <AlertDialog open={confirmCompleteOpen} onOpenChange={setConfirmCompleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja marcar esta demanda como concluída?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setConfirmCompleteOpen(false); setConfirmCompleteId(null); }}>Não</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmComplete}>Sim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Emitir Recibo overlay */}
      <Dialog open={showReciboButton} onOpenChange={setShowReciboButton}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Demanda concluída!</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">Deseja emitir um recibo para esta demanda?</p>
          <div className="flex flex-col gap-2">
            <Button className="w-full gap-2" onClick={() => { setShowReciboButton(false); navigate('/recibos/emissao'); }}>
              <FileText className="h-4 w-4" /> Emitir Recibo
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setShowReciboButton(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default DemandasPage;
