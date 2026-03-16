import { useState } from 'react';
import { Settings, AlertCircle, BarChart3, Clock } from 'lucide-react';
import EntityAvatar from './EntityAvatar';
import SettingsModal from './SettingsModal';
import type { Entity, Invoice } from '@/types/finance';

interface EntitySidebarProps {
  entities: Entity[];
  invoices: Invoice[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenResumo: () => void;
}

type TabType = 'clients' | 'suppliers';

const EntitySidebar = ({ entities, invoices, selectedId, onSelect, onOpenResumo }: EntitySidebarProps) => {
  const [tab, setTab] = useState<TabType>('clients');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const filtered = entities.filter((e) =>
    tab === 'clients' ? e.type === 'client' : e.type === 'supplier'
  );

  const hasOverdue = (entityId: string) =>
    invoices.some((inv) => inv.entityId === entityId && inv.status === 'overdue');

  const hasDueTomorrow = (entityId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    return invoices.some(
      (inv) => inv.entityId === entityId && inv.dueDate === tomorrowStr && inv.status !== 'paid'
    );
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Segmented Control */}
      <div className="p-4 pb-2">
        <div className="flex bg-secondary rounded-lg p-1 gap-1">
          <button
            onClick={() => setTab('clients')}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-all duration-150 ${
              tab === 'clients'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Clientes
          </button>
          <button
            onClick={() => setTab('suppliers')}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-all duration-150 ${
              tab === 'suppliers'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Fornecedores
          </button>
        </div>
      </div>

      {/* Entity List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {filtered.map((entity) => {
          const isOverdue = hasOverdue(entity.id);
          const isSelected = selectedId === entity.id;
          return (
            <button
              key={entity.id}
              onClick={() => onSelect(entity.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 mb-0.5 ${
                isSelected
                  ? 'bg-secondary text-foreground'
                  : 'text-foreground hover:bg-secondary/60'
              }`}
            >
              <EntityAvatar name={entity.name} size="sm" />
              <span className="text-sm font-medium truncate flex-1">{entity.name}</span>
              {isOverdue && (
                <AlertCircle className="h-4 w-4 text-destructive animate-pulse-alert shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <button
          onClick={onOpenResumo}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 px-2 py-1.5 w-full"
        >
          <BarChart3 className="h-4 w-4" />
          Resumo
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 px-2 py-1.5 w-full"
        >
          <Settings className="h-4 w-4" />
          Configurações
        </button>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default EntitySidebar;
