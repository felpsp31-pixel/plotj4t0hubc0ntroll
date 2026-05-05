
## Objetivo

Evitar que duas máquinas emitindo recibo ao mesmo tempo gerem o **mesmo número**. Hoje o número é calculado no navegador (`max(existentes) + 1`), com base em dados que podem estar desatualizados — então PC A e PC B podem produzir "0042" simultaneamente.

## Solução

Mover a geração do número para o **banco de dados**, garantindo unicidade real, independente de quantas máquinas estejam abertas.

### Passos

1. **Migração no banco**
   - Criar uma sequência Postgres `recibo_number_seq` começando do próximo número disponível (baseado no maior número atual em `recibos`).
   - Adicionar **índice único** em `recibos.number` para impedir duplicatas mesmo em caso de bug.
   - Criar função `next_recibo_number()` (SECURITY DEFINER) que retorna o próximo número formatado com 4 dígitos (`0001`, `0002`...).

2. **Ajuste no app (`src/contexts/RecibosContext.tsx`)**
   - Em `addRecibo`, antes de inserir, chamar `supabase.rpc('next_recibo_number')` para obter o número.
   - Inserir o recibo com esse número.
   - Se a inserção falhar por conflito de número (caso extremamente raro), tentar novamente uma vez.
   - Manter o rollback otimista já existente em caso de erro.

3. **Comportamento resultante**
   - Cada recibo recebe um número único atribuído pelo servidor, mesmo com várias máquinas emitindo ao mesmo tempo.
   - A listagem na tela continua igual; só muda a forma de obter o número na hora de salvar.

## Observação

Isso **não** adiciona atualização ao vivo entre máquinas — a tela do PC B ainda só verá o novo recibo após recarregar. Apenas garante que **não haverá colisão de numeração**.
