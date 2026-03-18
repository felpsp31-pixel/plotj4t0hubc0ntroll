

# Plano: Migrar dados do localStorage para o banco de dados (compartilhamento entre dispositivos)

## Problema
Atualmente, todos os dados do módulo de Recibos (clientes, solicitantes, obras, serviços, recibos) e fornecedores do Financeiro são armazenados no **localStorage do navegador**, que é isolado por dispositivo. Isso significa que cada celular/computador tem seus próprios dados, sem compartilhamento.

## Solução
Migrar toda a persistência de dados para o banco de dados na nuvem (Lovable Cloud), garantindo que qualquer dispositivo que acesse o sistema veja os mesmos dados em tempo real.

---

## Etapas

### 1. Criar tabelas no banco de dados
Novas tabelas para substituir o localStorage:

- **`empresa_info`** — dados da empresa (nome, CNPJ, endereço, telefone, email, logo)
- **`clientes`** — id, name, cnpj, phone, email
- **`solicitantes`** — id, cliente_id, name, phone
- **`obras`** — id, cliente_id, name
- **`servicos`** — id, code, description, unit_price
- **`recibos`** — id, number, date, cliente_id, solicitante_id, obra_id, lines (jsonb), total
- **`suppliers`** — id, name, document, phone, email, retains_iss

Todas com RLS aberta para anon/authenticated (sistema interno com senha, sem auth por usuário).

### 2. Refatorar RecibosContext
- Trocar `localStorage.getItem/setItem` por queries ao banco via Supabase SDK
- Carregar dados do banco ao iniciar (`useEffect` com fetch inicial)
- Cada operação (add/update/delete) persiste no banco em vez do localStorage
- Manter estado local (React state) como cache para UI responsiva

### 3. Refatorar Dashboard (fornecedores)
- Migrar `financeiro_suppliers` do localStorage para a tabela `suppliers` no banco
- Carregar e persistir via Supabase SDK

### 4. Remover sincronizações via localStorage
- Eliminar os helpers `syncAddCliente`, `syncUpdateCliente`, `syncDeleteCliente`
- Eliminar hooks `useClientesFinanceiro` e `useMontantes` baseados em localStorage
- Substituir por queries diretas ao banco (a tabela `clientes` agora é compartilhada)

### 5. Migração de dados existentes
- Na primeira carga, se o banco estiver vazio e o localStorage tiver dados, fazer upload automático (migração one-time) para não perder dados já cadastrados

---

## Detalhes técnicos

- **9 tabelas** novas criadas via migration SQL
- **RLS**: SELECT/INSERT/UPDATE/DELETE abertos para anon e authenticated (sistema protegido por senha no frontend)
- **RecibosContext**: ~200 linhas refatoradas para usar `supabase.from(...).select/insert/update/delete`
- **Dashboard.tsx**: fornecedores migrados de localStorage para tabela `suppliers`
- **Hooks removidos**: `useClientesFinanceiro.ts`, `useMontantes.ts` (substituídos por queries ao banco)
- **Montantes**: calculados sob demanda a partir das tabelas `clientes` + `recibos` no banco

