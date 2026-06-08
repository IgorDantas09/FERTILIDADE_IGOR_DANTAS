# AgroInData - Sistema de Recomendação de Correção de Solo

Projeto React + TypeScript + Vite para upload de análise de solo, interpretação visual de nutrientes, recomendações de calagem, gessagem, cama de frango, fósforo, potássio e micronutrientes, com geração de laudo em PDF.

## Como subir no GitHub

Este projeto foi gerado sem pasta `src`, com todos os arquivos principais na raiz, para facilitar o envio manual ao GitHub.

Arquivos principais:

- `App.tsx`
- `main.tsx`
- `components.tsx`
- `parser.ts`
- `profiles.ts`
- `calculators.ts`
- `pdf.ts`
- `types.ts`
- `styles.css`
- `index.html`
- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.node.json`
- `.gitignore`

## Como rodar localmente

```bash
npm install
npm run dev
```

## Como gerar versão para produção

```bash
npm run build
```

## Deploy na Vercel

1. Crie um repositório no GitHub.
2. Suba todos os arquivos da raiz do projeto.
3. Acesse a Vercel.
4. Importe o repositório.
5. Framework: Vite.
6. Build command: `npm run build`.
7. Output directory: `dist`.

## Modelo de planilha aceito

A planilha deve ter as colunas:

| Nutriente | U.M | Valor |
|---|---|---|
| pH | | 5.2 |
| M.O | g/dm3 | 7 |
| P(r) | Mg/dm3 | 4 |
| Ca | mmol/dm3 | 16 |
| Mg | mmol/dm3 | 3 |
| CTC | mmol/dm3 | 37 |
| V | % | 51 |

O sistema aceita `.xlsx`, `.xls`, `.ods` e `.csv`.

## Onde ajustar recomendações

As culturas e os parâmetros agronômicos ficam no arquivo `profiles.ts`.

A interpretação visual dos nutrientes também está em `profiles.ts`, no objeto `INTERPRETATION_RULES`.

As fórmulas ficam no arquivo `calculators.ts`.

## Observação técnica

Este é um MVP técnico. Antes de uso comercial, valide os parâmetros regionais, método de extração do laboratório, textura, produtividade esperada e legislação local com responsável técnico.
