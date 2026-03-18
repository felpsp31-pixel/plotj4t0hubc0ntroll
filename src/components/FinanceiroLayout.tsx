import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const FinanceiroLayout = () => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const expanded = hovered;

  const handleExit = () => {
    sessionStorage.removeItem('financial_auth');
    navigate('/');
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-screen flex overflow-hidden bg-background">
        <aside
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={cn(
            'shrink-0 flex flex-col border-r border-border bg-sidebar-background transition-all duration-200 overflow-hidden',
            expanded ? 'w-56' : 'w-14'
          )}
        >
          <div className="px-2 py-4">
            <button onClick={() => navigate('/recibos')} className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md">
              <ArrowLeft className="h-5 w-5 shrink-0" />
              {expanded && <span className="whitespace-nowrap">Emissão Recibos</span>}
            </button>
          </div>
          <nav className="flex-1 px-2 space-y-1">
            {(() => {
              const link = (
                <NavLink
                  to="/financeiro"
                  end
                  className={({ isActive }) => cn(
                    'flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors whitespace-nowrap',
                    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <LayoutDashboard className="h-5 w-5 shrink-0" />
                  {expanded && 'Painel Financeiro'}
                </NavLink>
              );
              return expanded ? link : (
                <Tooltip>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">Painel Financeiro</TooltipContent>
                </Tooltip>
              );
            })()}
          </nav>
          <div className="border-t border-border px-2 py-2">
            {expanded ? (
              <Button variant="ghost" className="w-full justify-start gap-2 px-2 text-destructive" onClick={handleExit}>
                <LogOut className="h-5 w-5 shrink-0" /> Sair da área financeira
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start px-2 text-destructive" onClick={handleExit}>
                    <LogOut className="h-5 w-5 shrink-0" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sair da área financeira</TooltipContent>
              </Tooltip>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  );
};

export default FinanceiroLayout;
