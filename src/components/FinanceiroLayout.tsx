import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FinanceiroLayout = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleExit = () => {
    sessionStorage.removeItem('financial_auth');
    navigate('/');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <aside className="w-56 shrink-0 flex flex-col border-r border-border bg-sidebar-background">
        <div className="p-4 space-y-1">
          <button onClick={() => navigate('/recibos')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Emissão Recibos
          </button>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          <NavLink
            to="/financeiro"
            end
            className={({ isActive }) => cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
              isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            )}
          >
            <LayoutDashboard className="h-4 w-4" /> Painel Financeiro
          </NavLink>
        </nav>
        <div className="p-2 border-t border-border space-y-1">
          <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleExit}>
            <LogOut className="h-4 w-4 mr-2" /> Sair da área financeira
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default FinanceiroLayout;
