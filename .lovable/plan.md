

# Plano: Campo "Entrega" em Obras + Alertas por E-mail

## Parte 1 — Campo "Entrega" nas Obras

### Resumo
Cada obra ganha um toggle "Entrega" (sim/não). Se "Sim", aparece um campo de valor. Na **emissão do recibo**, quando a obra é selecionada, uma linha extra "Entrega" aparece automaticamente com o valor cadastrado. O usuário pode **remover ou manter** essa linha diretamente no recibo (não no cadastro).

### Alterações

**1. Migração no banco** — Adicionar colunas na tabela `obras`:
- `has_delivery boolean NOT NULL DEFAULT false`
- `delivery_value numeric NOT NULL DEFAULT 0`

**2. Tipo `Obra`** (`src/types/recibos.ts`):
- Adicionar `hasDelivery: boolean` e `deliveryValue: number`

**3. RecibosContext** (`src/contexts/RecibosContext.tsx`):
- Mapear `has_delivery` / `delivery_value` no fetch e nas funções `addObra` / `updateObra`

**4. Cadastro de Obras** (`src/pages/recibos/ClientesReciboPage.tsx`):
- No formulário de nova obra: adicionar Switch "Entrega?" e Input de valor (visível se Sim)
- Na tabela de obras: exibir coluna "Entrega" com valor formatado ou "—"
- No modo edição: mesmo toggle + input
- O valor é apenas cadastrado aqui; remoção se faz desmarcando o toggle

**5. Emissão do Recibo** (`src/pages/recibos/EmissaoReciboPage.tsx`):
- Quando uma obra com `hasDelivery=true` é selecionada, inserir automaticamente uma linha extra com `serviceCode: 'ENTREGA'`, `description: 'Entrega'`, `quantity: 1`, `unitPrice: deliveryValue`
- A linha aparece como qualquer outra linha na tabela — o usuário pode **remover** mudando o serviço para vazio ou zerando a quantidade, ou simplesmente mantê-la
- Se a obra mudar para uma sem entrega, remover a linha automática de entrega

---

## Parte 2 — Alertas de Vencimento por E-mail

### Pré-requisito
O projeto **não tem domínio de e-mail configurado**. Antes de implementar o envio, é necessário configurar um domínio de e-mail.

### Passos

**1. Configurar domínio de e-mail** — O usuário precisará abrir o painel de configuração de e-mail e adicionar/verificar um domínio.

**2. Edge Function** (`supabase/functions/check-due-invoices/index.ts`):
- Consulta `financial_invoices` com `status = 'open'` e `due_date <= hoje`
- Consulta `empresa_info` para obter o e-mail destino
- Títulos vencendo hoje: envia e-mail listando-os
- Títulos atrasados (`due_date < hoje`): envia e-mail separado e atualiza status para `overdue`
- Usa a infraestrutura de e-mail transacional do projeto

**3. Agendamento**: Configurar execução diária da Edge Function (ex: via `pg_cron` ou `pg_net`)

---

## Resumo de arquivos

| Arquivo | Ação |
|---|---|
| `supabase/migrations/` | Nova migração (`has_delivery`, `delivery_value`) |
| `src/types/recibos.ts` | Adicionar campos ao tipo `Obra` |
| `src/contexts/RecibosContext.tsx` | Mapear novos campos no CRUD |
| `src/pages/recibos/ClientesReciboPage.tsx` | Toggle + input no cadastro de obras |
| `src/pages/recibos/EmissaoReciboPage.tsx` | Linha automática removível de entrega |
| `supabase/functions/check-due-invoices/index.ts` | Edge Function de alertas |
| Configuração de e-mail | Domínio precisa ser configurado primeiro |

