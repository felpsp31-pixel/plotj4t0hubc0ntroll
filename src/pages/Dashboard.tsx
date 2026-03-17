import { useState, useEffect, useRef } from 'react';
import { LogOut } from 'lucide-react';
import ImportNotaFiscalDialog from '@/components/ImportNotaFiscalDialog';
import { useAuth } from '@/contexts/AuthContext';
import EntitySidebar from '@/components/EntitySidebar';
import EntityHeader from '@/components/EntityHeader';
import KanbanBoard from '@/components/KanbanBoard';
import StatusSummaryCards from '@/components/StatusSummaryCards';
import ClientsTable from '@/components/ClientsTable';
import SuppliersTable from '@/components/SuppliersTable';
import ExportResumoButton from '@/components/ExportResumoButton';
import NewInvoiceDialog from '@/components/NewInvoiceDialog';
import { MOCK_ENTITIES, MOCK_INVOICES } from '@/types/finance';
import type { Invoice } from '@/types/finance';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MIN_SIDEBAR = 260;
const MAX_SIDEBAR = 450;

const Dashboard = () => {
  const { signOut } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_ENTITIES[0]?.id ?? null);
  const [invoices, setInvoices] = useState(MOCK_INVOICES);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [resumoOpen, setResumoOpen] = useState(false);
  const dragging = useRef(false);

  const selectedEntity = MOCK_ENTITIES.find((e) => e.id === selectedId) ?? null;
  const entityInvoices = selectedId
    ? invoices.filter((inv) => inv.entityId === selectedId)
    : [];

  const handleMarkPaid = (invoiceId: string) => {
    const previous = invoices.find((inv) => inv.id === invoiceId);
    if (!previous) return;
    const previousStatus = previous.status;

    setInvoices((prev) =>
      prev.map((inv) => inv.id === invoiceId ? { ...inv, status: 'paid' as const } : inv)
    );

    toast.success('Título marcado como pago!', {
      action: {
        label: 'Desfazer',
        onClick: () => {
          setInvoices((prev) =>
            prev.map((inv) => inv.id === invoiceId ? { ...inv, status: previousStatus } : inv)
          );
          toast.info('Ação desfeita.');
        },
      },
      duration: 6000,
    });
  };

  const handleDelete = (invoiceId: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    toast.success('Lançamento apagado.');
  };

  const handleUpdate = (invoiceId: string, data: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((inv) => inv.id === invoiceId ? { ...inv, ...data } : inv)
    );
    toast.success('Lançamento atualizado.');
  };

  const handleAdd = (invoice: Invoice) => {
    setInvoices((prev) => [...prev, invoice]);
    toast.success('Lançamento adicionado.');
  };

  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const overdueToday = invoices.filter((inv) => inv.dueDate === todayStr && inv.status !== 'paid');
    overdueToday.forEach((inv) => {
      const entity = MOCK_ENTITIES.find((e) => e.id === inv.entityId);
      if (entity) {
        toast.error(`Atenção: Nota de ${entity.name} está Atrasada!`, { duration: 5000 });
      }
    });

    const overdue = invoices.filter((inv) => inv.status === 'overdue');
    if (overdue.length > 0) {
      toast.warning(`${overdue.length} título(s) em atraso detectado(s).`, { duration: 5000 });
    }

    const supplierEntities = MOCK_ENTITIES.filter((e) => e.type === 'supplier');
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
      <div style={{ width: sidebarWidth, minWidth: MIN_SIDEBAR, maxWidth: MAX_SIDEBAR }} className="shrink-0">
        <EntitySidebar
          entities={MOCK_ENTITIES}
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

      <div className="flex-1 flex flex-col min-w-0 p-6 overflow-hidden">
        {selectedEntity ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <EntityHeader entity={selectedEntity} />
              <div className="flex items-center gap-2">
                <ImportNotaFiscalDialog />
                <NewInvoiceDialog entityId={selectedEntity.id} onAdd={handleAdd} />
                <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <StatusSummaryCards invoices={entityInvoices} />
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

      <Sheet open={resumoOpen} onOpenChange={setResumoOpen}>
        <SheetContent side="left" className="w-[600px] sm:w-[700px] sm:max-w-none overflow-y-auto">
          <SheetHeader className="flex flex-row items-center justify-between pr-8">
            <SheetTitle>Resumo Financeiro</SheetTitle>
            <ExportResumoButton entities={MOCK_ENTITIES} invoices={invoices} />
          </SheetHeader>
          <div className="mt-4">
            <Tabs defaultValue="clients">
              <TabsList className="w-full">
                <TabsTrigger value="clients" className="flex-1">Clientes</TabsTrigger>
                <TabsTrigger value="suppliers" className="flex-1">Fornecedores</TabsTrigger>
              </TabsList>
              <TabsContent value="clients" className="mt-4">
                <ClientsTable entities={MOCK_ENTITIES} invoices={invoices} />
              </TabsContent>
              <TabsContent value="suppliers" className="mt-4">
                <SuppliersTable entities={MOCK_ENTITIES} invoices={invoices} />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Dashboard;
