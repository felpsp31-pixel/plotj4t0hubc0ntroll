import { useState, useEffect, useRef } from 'react';
import EntitySidebar from '@/components/EntitySidebar';
import EntityHeader from '@/components/EntityHeader';
import KanbanBoard from '@/components/KanbanBoard';
import ClientsTable from '@/components/ClientsTable';
import { MOCK_ENTITIES, MOCK_INVOICES } from '@/types/finance';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const MIN_SIDEBAR = 260;
const MAX_SIDEBAR = 450;

const Dashboard = () => {
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

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const overdueToday = invoices.filter((inv) => inv.dueDate === today && inv.status !== 'paid');
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
      {/* Sidebar */}
      <div style={{ width: sidebarWidth, minWidth: MIN_SIDEBAR, maxWidth: MAX_SIDEBAR }} className="shrink-0">
        <EntitySidebar
          entities={MOCK_ENTITIES}
          invoices={invoices}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onOpenResumo={() => setResumoOpen(true)}
        />
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={startDrag}
        className="w-1 hover:w-1.5 bg-border hover:bg-primary/30 cursor-col-resize transition-all duration-150 shrink-0"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 p-6 overflow-hidden">
        {selectedEntity ? (
          <>
            <EntityHeader entity={selectedEntity} />
            <div className="flex-1 min-h-0">
              <KanbanBoard invoices={entityInvoices} onMarkPaid={handleMarkPaid} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Selecione um cliente ou fornecedor
          </div>
        )}
      </div>

      {/* Resumo Sheet */}
      <Sheet open={resumoOpen} onOpenChange={setResumoOpen}>
        <SheetContent side="left" className="w-[600px] sm:w-[700px] sm:max-w-none overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Resumo de Clientes</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <ClientsTable entities={MOCK_ENTITIES} invoices={invoices} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Dashboard;
