# TODO - Bizu EB

## 📌 Backlog Atual
- [ ] `B1` Inicializar o app Expo em `apps/mobile` com estrutura base de navegacao e ambientes.
- [ ] `B2` Consolidar gerenciamento de dependencias/lockfile no nivel da raiz do monorepo.
- [ ] `B4` Estruturar versionamento de backend em `supabase/` (schema, migrations e seeds).
- [ ] `B5` Implementar fluxo completo de sincronizacao `Admin -> Supabase -> Mobile` com foco offline-first.

## ✅ Concluido
- [x] `C1` Reorganizado o repositorio para monorepo com `apps/admin`, `apps/mobile` e `packages/shared`.
- [x] `C2` Movido o projeto Admin para `apps/admin` preservando scripts do app.
- [x] `C3` Criado `package.json` da raiz com npm workspaces para orquestracao.
- [x] `C4` Criado `tsconfig.base.json` na raiz e configurado `apps/admin/tsconfig.json` com `extends`.
- [x] `C5` Criado esqueleto inicial de `packages/shared`.
- [x] `C6` Removida injecao de `GEMINI_API_KEY` no Vite do Admin.
- [x] `C7` Removido alias `@` do Vite do Admin (nao utilizado no codigo atual).
- [x] `C8` Contrato shared (TS+Zod) implementado em `packages/shared` com tipos, schemas e helpers parse.
- [x] `C9` SQL Supabase versionado em `database/` (tabelas, indices, RLS, policies, storage e seed dev).

## 🕒 Log de Execucoes do Codex
- `2026-02-07 10:49 (local)` Atualizados `README.md` e `TODO.md` para refletir o estado atual do monorepo, arquitetura, fluxo de dados e plano de execucao. Tarefas impactadas: `C1`, `C2`, `C3`, `C4`, `C5`, `C6`, `C7`, `B1`, `B2`, `B3`, `B4`, `B5`.
- `2026-02-07 11:15 (local)` Implementado contrato de catalogo em `packages/shared` com TypeScript + Zod (`types.ts`, `schema.ts`, `index.ts`, `tsconfig.json`) e validado com `npx tsc --noEmit`. Tarefas impactadas: `C8`, `B3`.
- `2026-02-07 11:29 (local)` Criada pasta `database/` com scripts SQL versionados (`001_tables.sql` a `006_seed_dev.sql`) e `database/README.md`, cobrindo tabelas, checks, trigger de `updated_at`, indices, RLS, policies e bucket `content`. Tarefas impactadas: `C9`, `B4`.
