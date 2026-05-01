# Adicionar logo da empresa ao PDF do recibo

## Contexto
- A logo é configurada nas configurações (`RecibosLayout.tsx`) e armazenada como **data URL base64** no campo `empresaInfo.logo` (tabela `empresa_info`).
- Hoje o PDF gerado em `src/pages/recibos/EmissaoReciboPage.tsx` (`generatePdf`) escreve apenas o texto do cabeçalho (nome, CNPJ, endereço, telefone) — a logo é ignorada.

## Mudança
Editar **somente** `src/pages/recibos/EmissaoReciboPage.tsx`, função `generatePdf`:

1. Se `empresaInfo.logo` existir (string não vazia, começa com `data:image/`):
   - Detectar o formato a partir do prefixo do data URL (`PNG`, `JPEG`, `WEBP`).
   - Adicionar a imagem no topo direito do PDF via `doc.addImage(empresaInfo.logo, format, x, y, w, h)`.
   - Tamanho fixo proporcional: caixa de ~35x20mm posicionada em `x=160, y=12` (canto superior direito da página A4 retrato), usando `object-fit: contain` lógico (passar largura/altura máximas e deixar jsPDF preservar proporção via cálculo manual a partir de uma `Image()` carregada).
2. Se não houver logo, manter exatamente o layout atual (sem espaço vazio).
3. O cabeçalho de texto (nome, CNPJ, endereço) permanece à esquerda nas mesmas coordenadas — a logo fica ao lado, não desloca o restante.

## Detalhes técnicos
- Carregar dimensões reais da imagem com:
  ```ts
  const img = new Image();
  img.src = empresaInfo.logo;
  await new Promise(res => { img.onload = res; });
  const maxW = 40, maxH = 22;
  const ratio = Math.min(maxW / img.width, maxH / img.height);
  const w = img.width * ratio, h = img.height * ratio;
  doc.addImage(empresaInfo.logo, fmt, 200 - w - 14, 12, w, h);
  ```
- `fmt` derivado do prefixo: `data:image/png` → `'PNG'`, `jpeg|jpg` → `'JPEG'`, `webp` → `'WEBP'`.
- Wrap em `try/catch` para que falha de logo nunca impeça a geração do PDF.
- Aplica-se tanto a `handleExportPdf` quanto a `handlePrint` (ambos usam `generatePdf`).

## Fora de escopo
- Não alterar o upload/armazenamento da logo.
- Não alterar visual da tela (preview HTML do recibo).
