export type InvoiceStatus = 'open' | 'paid' | 'overdue';

export interface Attachment {
  url: string;
  name: string;
  date: string; // ISO date string
}

export interface Invoice {
  id: string;
  entityId: string;
  description: string;
  value: number;
  dueDate: string;
  referenceMonth: string;
  status: InvoiceStatus;
  attachments: Attachment[];
}

export interface Entity {
  id: string;
  name: string;
  type: 'supplier' | 'client';
  phone?: string;
  email?: string;
  document?: string;
  retainsISS: boolean;
}

export const MOCK_ENTITIES: Entity[] = [
  { id: '1', name: 'Tech Solutions Ltda', type: 'client', phone: '(11) 99999-0001', email: 'contato@techsolutions.com', document: '12.345.678/0001-01', retainsISS: true },
  { id: '2', name: 'Digital Services SA', type: 'client', phone: '(11) 99999-0002', email: 'fin@digitalservices.com', document: '23.456.789/0001-02', retainsISS: false },
  { id: '3', name: 'Construtora Alfa', type: 'client', phone: '(21) 99999-0003', email: 'pagar@alfa.com', document: '34.567.890/0001-03', retainsISS: true },
  { id: '4', name: 'Mercado Central', type: 'client', phone: '(31) 99999-0004', email: 'financeiro@mercado.com', document: '45.678.901/0001-04', retainsISS: false },
  { id: '5', name: 'Papelaria Express', type: 'supplier', phone: '(11) 98888-0001', email: 'vendas@papelaria.com', document: '56.789.012/0001-05', retainsISS: false },
  { id: '6', name: 'NetHost Telecom', type: 'supplier', phone: '(11) 98888-0002', email: 'nf@nethost.com', document: '67.890.123/0001-06', retainsISS: false },
  { id: '7', name: 'Segurança Total', type: 'supplier', phone: '(11) 98888-0003', email: 'cobranca@segtotal.com', document: '78.901.234/0001-07', retainsISS: false },
];

export const MOCK_INVOICES: Invoice[] = [
  { id: 'inv1', entityId: '1', description: 'NF 1234 - Consultoria', value: 15750.00, dueDate: '2026-03-20', referenceMonth: 'Mar/2026', status: 'open', attachments: [] },
  { id: 'inv2', entityId: '1', description: 'NF 1235 - Suporte', value: 4200.00, dueDate: '2026-02-15', referenceMonth: 'Fev/2026', status: 'overdue', attachments: [] },
  { id: 'inv3', entityId: '2', description: 'NF 5001 - Licença Software', value: 32000.00, dueDate: '2026-03-25', referenceMonth: 'Mar/2026', status: 'open', attachments: [] },
  { id: 'inv4', entityId: '3', description: 'NF 7890 - Projeto Civil', value: 89500.00, dueDate: '2026-01-10', referenceMonth: 'Jan/2026', status: 'paid', attachments: [] },
  { id: 'inv5', entityId: '3', description: 'NF 7891 - Medição', value: 45000.00, dueDate: '2026-03-05', referenceMonth: 'Mar/2026', status: 'overdue', attachments: [] },
  { id: 'inv6', entityId: '4', description: 'Boleto 4455', value: 1200.00, dueDate: '2026-03-18', referenceMonth: 'Mar/2026', status: 'open', attachments: [] },
  { id: 'inv7', entityId: '5', description: 'NF 300 - Material', value: 3400.00, dueDate: '2026-02-28', referenceMonth: 'Fev/2026', status: 'paid', attachments: [] },
  { id: 'inv8', entityId: '6', description: 'NF 901 - Internet', value: 890.00, dueDate: '2026-03-17', referenceMonth: 'Mar/2026', status: 'open', attachments: [] },
  { id: 'inv9', entityId: '7', description: 'NF 112 - Monitoramento', value: 2100.00, dueDate: '2026-03-22', referenceMonth: 'Mar/2026', status: 'open', attachments: [] },
  { id: 'inv10', entityId: '2', description: 'NF 5002 - Manutenção', value: 8750.00, dueDate: '2026-01-20', referenceMonth: 'Jan/2026', status: 'paid', attachments: [] },
];
