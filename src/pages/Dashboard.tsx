import { useState, useEffect, useRef, useMemo } from 'react';
import { LogOut, Receipt, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import ImportNotaFiscalDialog from '@/components/ImportNotaFiscalDialog';
import { useMontantes } from '@/hooks/useMontantes';
import { useAuth } from '@/contexts/AuthContext';
import EntitySidebar from '@/components/EntitySidebar';
import EntityHeader from '@/components/EntityHeader';
import KanbanBoard from '@/components/KanbanBoard';
import StatusSummaryCards from '@/components/StatusSummaryCards';
import ClientsTable from '@/components/ClientsTable';
import SuppliersTable from '@/components/SuppliersTable';
import ExportResumoButton from '@/components/ExportResumoButton';
import NewInvoiceDialog from '@/components/NewInvoiceDialog';
import SupplierFormDialog from '@/components/SupplierFormDialog';
import type { Entity } from '@/types/finance';
import { useClientesFinanceiro } from '@/hooks/useClientesFinanceiro';
import { useFinancialEntities } from '@/hooks/useFinancialEntities';
import { useFinancialInvoices } from '@/hooks/useFinancialInvoices';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MIN_SIDEBAR = 260;
const MAX_SIDEBAR = 450;

const Dashboard = () => {
  const { signOut } = useAuth();
  const montantes = useMontantes();
  const clientesRecibos = useClientesFinanceiro();
  const isMobile = useIsMobile();
  const totalOperacional = montantes.reduce((s, m) => s + m.total, 0);

  const allEntities = useMemo<Entity[]>(() => {
    const merged = [...MOCK_ENTITIES];
    const existingDocs = new Set(MOCK_ENTITIES.map(e => e.document).filter(Boolean));
    for (const c of clientesRecibos) {
      if (!existingDocs.has(c.cnpj)) {
        merged.push({
          id: c.id,
          name: c.name,
          type: 'client' as const,
          phone: c.phone || undefined,
          email: c.email || undefined,
          document: c.cnpj,
          retainsISS: false,
        });
      }
    }
    return merged;
  }, [clientesRecibos]);

  const { invoices, handleMarkPaid, handleDelete, handleUpdate, handleAdd } = useFinancialInvoices();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => isMobile);
  const [resumoOpen, setResumoOpen] = useState(false);
  const dragging = useRef(false);

  // Collapse sidebar on mobile by default
  useEffect(() => {
    if (isMobile) setSidebarCollapsed(true);
  }, [isMobile]);

  const selectedEntity = allEntities.find((e) => e.id === selectedId) ?? null;
  const entityInvoices = selectedId
    ? invoices.filter((inv) => inv.entityId === selectedId)
    : [];

  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const overdueToday = invoices.filter((inv) => inv.dueDate === todayStr && inv.status !== 'paid');
    overdueToday.forEach((inv) => {
      const entity = allEntities.find((e) => e.id === inv.entityId);
      if (entity) {
        toast.warning(`Atenção: Nota de ${entity.name} vence hoje!`, { duration: 5000 });
      }
    });

    const overdue = invoices.filter((inv) => inv.status === 'overdue');
    if (overdue.length > 0) {
      toast.warning(`${overdue.length} título(s) em atraso detectado(s).`, { duration: 5000 });
    }

    const supplierEntities = allEntities.filter((e) => e.type === 'supplier');
    const supplierIds = new Set(supplierEntities.map((e) => e.id));
    const dueTomorrow = invoices.filter(
      (inv) => inv.dueDate === tomorrowStr && inv.status !== 'paid' && supplierIds.has(inv.entityId)
    );
    dueTomorrow.forEach((inv) => {
      const entity = supplierEntities.find((e) => e.id === inv.entityId);
      if (entity) {
        const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.value);
        toast.warning(
          `Fornecedor "${entity.name}" tem título de ${formatted} vencendo amanhã!`,
          { duration: 8000 }
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const newWidth = Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, e.clientX));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startDrag = () => {
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {!sidebarCollapsed && !isMobile && (
        <>
          <div style={{ width: sidebarWidth, minWidth: MIN_SIDEBAR, maxWidth: MAX_SIDEBAR }} className="shrink-0">
            <EntitySidebar
              entities={allEntities}
              invoices={invoices}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onOpenResumo={() => setResumoOpen(true)}
            />
          </div>
          <div
            onMouseDown={startDrag}
            className="w-1 hover:w-1.5 bg-border hover:bg-primary/30 cursor-col-resize transition-all duration-150 shrink-0"
          />
        </>
      )}

      {/* Mobile entity sidebar as sheet */}
      {isMobile && !sidebarCollapsed && (
        <Sheet open={!sidebarCollapsed} onOpenChange={(open) => setSidebarCollapsed(!open)}>
          <SheetContent side="left" className="w-full max-w-[300px] p-0">
            <EntitySidebar
              entities={allEntities}
              invoices={invoices}
              selectedId={selectedId}
              onSelect={(id) => { setSelectedId(id); setSidebarCollapsed(true); }}
              onOpenResumo={() => setResumoOpen(true)}
            />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-4">
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            className="p-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={sidebarCollapsed ? 'Mostrar painel' : 'Ocultar painel'}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 pt-2 overflow-hidden">
        {selectedEntity ? (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2 sm:gap-4">
              <EntityHeader entity={selectedEntity} />
              <div className="flex items-center gap-2 flex-wrap">
                <ImportNotaFiscalDialog />
                <NewInvoiceDialog entityId={selectedEntity.id} onAdd={handleAdd} />
                <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" onClick={signOut} title="Sair">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <StatusSummaryCards invoices={entityInvoices} />
            {totalOperacional > 0 && (
              <div className="mb-2 p-3 rounded-md border border-border bg-muted/50 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Faturamento Operacional (Recibos):</span>
                <span className="text-sm font-bold text-primary">{totalOperacional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            )}
            <div className="flex-1 min-h-0">
              <KanbanBoard invoices={entityInvoices} onMarkPaid={handleMarkPaid} onDelete={handleDelete} onUpdate={handleUpdate} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Selecione um cliente ou fornecedor
          </div>
        )}
        </div>
      </div>

      <Sheet open={resumoOpen} onOpenChange={setResumoOpen}>
        <SheetContent side="left" className="w-full sm:w-[600px] sm:max-w-none overflow-y-auto">
          <SheetHeader className="flex flex-row items-center justify-between pr-8">
            <SheetTitle>Resumo Financeiro</SheetTitle>
            <ExportResumoButton entities={allEntities} invoices={invoices} />
          </SheetHeader>
          <div className="mt-4">
            <ClientsTable entities={allEntities} invoices={invoices} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Dashboard;
