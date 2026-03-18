import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FileText, Users, Wrench, BarChart3, FileBarChart, Settings, ArrowLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRecibos } from '@/contexts/RecibosContext';
import { useSyncReciboSummaries } from '@/hooks/useSyncReciboSummaries';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const links = [
  { to: '/recibos', label: 'Recibos', icon: FileText, end: true },
  { to: '/recibos/clientes', label: 'Clientes', icon: Users, end: false },
  { to: '/recibos/servicos', label: 'Serviços', icon: Wrench, end: false },
  { to: '/recibos/dashboard', label: 'Dashboard', icon: BarChart3, end: false },
  { to: '/recibos/relatorios', label: 'Relatórios', icon: FileBarChart, end: false },
];

const RecibosLayout = () => {
  const navigate = useNavigate();
  const { empresaInfo, setEmpresaInfo } = useRecibos();
  useSyncReciboSummaries();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [form, setForm] = useState(empresaInfo);

  const handleSave = () => {
    setEmpresaInfo(form);
    setSettingsOpen(false);
    toast.success('Configurações salvas');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(p => ({ ...p, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-screen flex overflow-hidden bg-background">
        <aside className={cn(
          'shrink-0 flex flex-col border-r border-border bg-sidebar-background transition-all duration-200',
          collapsed ? 'w-14' : 'w-56'
        )}>
          <div className={cn('flex items-center', collapsed ? 'justify-center p-2' : 'justify-between p-4')}>
            {!collapsed && (
              <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Início
              </button>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setCollapsed(c => !c)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
                >
                  {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{collapsed ? 'Expandir menu' : 'Minimizar menu'}</TooltipContent>
            </Tooltip>
          </div>

          {collapsed && (
            <div className="flex justify-center pb-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => navigate('/')} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Início</TooltipContent>
              </Tooltip>
            </div>
          )}

          <nav className={cn('flex-1 space-y-1', collapsed ? 'px-1' : 'px-2')}>
            {links.map(l => (
              <Tooltip key={l.to}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) => cn(
                      'flex items-center rounded-md text-sm transition-colors',
                      collapsed ? 'justify-center p-2' : 'gap-2 px-3 py-2',
                      isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                  >
                    <l.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && l.label}
                  </NavLink>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">{l.label}</TooltipContent>}
              </Tooltip>
            ))}
          </nav>

          <div className={cn('border-t border-border', collapsed ? 'p-1' : 'p-2')}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn('w-full', collapsed ? 'justify-center px-2' : 'justify-start')}
                  onClick={() => { setForm(empresaInfo); setSettingsOpen(true); }}
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="ml-2">Configurações</span>}
                </Button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">Configurações</TooltipContent>}
            </Tooltip>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden p-4 flex flex-col">
          <Outlet />
        </main>

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Configurações da Empresa</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>CNPJ</Label><Input value={form.cnpj} onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} /></div>
              <div><Label>Endereço</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div>
                <Label>Logo</Label>
                <Input type="file" accept="image/*" onChange={handleLogoUpload} />
                {form.logo && <img src={form.logo} alt="Logo" className="mt-2 h-16 object-contain" />}
              </div>
              <Button className="w-full" onClick={handleSave}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default RecibosLayout;
