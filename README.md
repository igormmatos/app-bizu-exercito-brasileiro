# Bizu EB Monorepo

## Visao geral
Este repositorio concentra o projeto Bizu EB em formato monorepo.

- `Admin Web`: painel de publicacao e gestao de conteudo (React + Vite)
- `Mobile App`: app de consumo de conteudo com foco offline-first (bootstrap em andamento)
- `Shared`: pacote para tipos e contratos de dominio reutilizaveis
- `Supabase`: backend de dados/autenticacao previsto para o fluxo de publicacao e sincronizacao

O `Admin Web` e o canal principal de publicacao de conteudo.

## Arquitetura
- `apps/admin`: aplicacao web administrativa, onde o conteudo e criado e gerenciado
- `apps/mobile`: aplicacao mobile (Expo) para consumo publico, com area administrativa de diagnostico/sync
- `packages/shared`: tipos e contratos compartilhados entre admin e mobile
- `supabase/`: pasta reservada para schema/migrations/seeds (quando versionada no repositorio)

## Estrutura de pastas
```text
.
├─ apps/
│  ├─ admin/
│  └─ mobile/
├─ packages/
│  └─ shared/
├─ docs/
├─ package.json
└─ tsconfig.base.json
```

## Stack tecnologica
- Monorepo: npm workspaces
- Admin: React, TypeScript, Vite
- Mobile: Expo (planejado neste monorepo)
- Shared: TypeScript
- Backend: Supabase (integracao do MVP)

## Fluxo geral de dados
1. Conteudo e criado/atualizado no `Admin Web`.
2. Dados sao persistidos no `Supabase`.
3. O `Mobile App` sincroniza os dados e mantem cache local para operacao offline-first.
4. A area administrativa do mobile e usada para diagnostico e controle de sincronizacao.

## Como rodar o Admin localmente
Pre-requisitos:
- Node.js 20+
- npm 10+

Passos:
1. Na raiz, instale dependencias:
   - `npm install`
2. Inicie o admin via workspace:
   - `npm run dev:admin`
3. Acesse:
   - `http://localhost:3000`

Opcional (direto no app):
- `cd apps/admin`
- `npm run dev`

## Mobile App (Expo)
- Localizacao: `apps/mobile`
- Inicializacao via workspace:
  - `npm run start -w apps/mobile`
- Detalhes de execucao e comandos adicionais:
  - `apps/mobile/README.md`

## Status atual
MVP em construcao.

- Monorepo inicial criado com `apps/admin`, `apps/mobile` e `packages/shared`
- Admin web em funcionamento no workspace
- Mobile e shared ainda em fase de bootstrap de contratos e sincronizacao
