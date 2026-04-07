

# Plano: Modo claro/escuro + Serviços específicos por cliente

## Parte 1 — Alternância entre modo claro e escuro

O projeto ja usa `next-themes` e `darkMode: "class"` no Tailwind. Tem variáveis CSS para `.dark` definidas no `index.css`. Falta apenas o `ThemeProvider` e um botão de alternância.

### Alterações

**1. `src/main.tsx`** — Envolver o `<App />` com `ThemeProvider` do `next-themes` (attribute="class", defaultTheme="dark", storageKey="theme").

**2. `src/index.css`** — Adicionar variáveis para o modo claro (`:root` atual é escuro). Mover as variáveis atuais do `:root` para `.dark` e criar variáveis claras no `:root`.

**3. Botão de alternância** — Adicionar um botão Sun/Moon nos dois layouts:
- `src/components/recibos/RecibosLayout.tsx` — No rodapé da sidebar, ao lado de "Configurações"
- `src/components/FinanceiroLayout.tsx` — No header ou sidebar equivalente
- `src/pages/HomePage.tsx` — Canto superior

## Parte 2 — Serviços específicos por cliente

Cada cliente poderá ter serviços com valores personalizados que só aparecem ao emitir recibos para aquele cliente.

### Alterações

**1. Migração no banco** — Criar tabela `client_services`:
- `id uuid PK default gen_random_uuid()`
- `cliente_id uuid NOT NULL` (referência lógica a `clientes`)
- `code text NOT NULL`
- `description text NOT NULL`
- `unit_price numeric NOT NULL DEFAULT 0`
- RLS: ALL para anon/authenticated

**2. Tipo e contexto**:
- `src/types/recibos.ts` — Adicionar tipo `ClientService` com `id, clienteId, code, description, unitPrice`
- `src/contexts/RecibosContext.tsx` — Adicionar estado `clientServices`, fetch na inicialização, funções `addClientService`, `updateClientService`, `deleteClientService`

**3. UI de cadastro** (`src/pages/recibos/ClientesReciboPage.tsx`):
- Adicionar nova aba "Serviços do Cliente" no `Tabs` existente
- Formulário com Combobox de cliente + código + descrição + valor unitário
- Tabela listando serviços filtrados pelo cliente selecionado
- CRUD completo (adicionar, editar, excluir)

**4. Emissão do recibo** (`src/pages/recibos/EmissaoReciboPage.tsx`):
- Quando um cliente é selecionado, o Combobox de serviços nas linhas deve mostrar **tanto** os serviços globais **quanto** os serviços específicos daquele cliente
- Serviços do cliente aparecem com indicação visual (ex: prefixo ou cor diferente)
- O valor unitário usado é o do serviço específico do cliente (não o global)

## Resumo de arquivos

| Arquivo | Ação |
|---|---|
| `src/main.tsx` | Adicionar ThemeProvider |
| `src/index.css` | Reorganizar variáveis CSS (claro no :root, escuro em .dark) |
| `src/components/recibos/RecibosLayout.tsx` | Botão Sun/Moon |
| `src/components/FinanceiroLayout.tsx` | Botão Sun/Moon |
| `src/pages/HomePage.tsx` | Botão Sun/Moon |
| `supabase/migrations/` | Criar tabela `client_services` |
| `src/types/recibos.ts` | Tipo `ClientService` |
| `src/contexts/RecibosContext.tsx` | CRUD de `clientServices` |
| `src/pages/recibos/ClientesReciboPage.tsx` | Nova aba "Serviços do Cliente" |
| `src/pages/recibos/EmissaoReciboPage.tsx` | Mesclar serviços globais + do cliente no Combobox |

