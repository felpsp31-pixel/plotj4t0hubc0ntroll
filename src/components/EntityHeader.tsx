import { Phone, Mail, FileText } from 'lucide-react';
import EntityAvatar from './EntityAvatar';
import type { Entity } from '@/types/finance';

interface EntityHeaderProps {
  entity: Entity;
}

const EntityHeader = ({ entity }: EntityHeaderProps) => {
  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-3 mb-4">
      <div className="flex items-start gap-4">
        <EntityAvatar name={entity.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-lg font-semibold text-foreground truncate">{entity.name}</h2>
            {entity.retainsISS && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-badge-iss text-badge-iss-foreground shrink-0">
                Retém ISS
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            {entity.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {entity.phone}
              </span>
            )}
            {entity.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {entity.email}
              </span>
            )}
            {entity.document && (
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {entity.document}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityHeader;
