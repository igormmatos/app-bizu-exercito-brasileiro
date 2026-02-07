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
- [x] `C10` Admin MVP implementado em `apps/admin` com Auth (email/senha), CRUD de categories/items e upload no bucket `content`.
- [x] `C11` Mobile Sync + Cache (AsyncStorage) implementado com leitura publica do Supabase, validacao `@bizu/shared` e telas consumindo cache.
- [x] `C12` Offline downloads (media) no mobile com arquivo local, status persistido e acoes baixar/abrir/remover.
- [x] `C13` Migrado playback de audio no mobile de `expo-av` para `expo-audio` e simplificado `metro.config.js` para padrao Expo com dedupe minimo de React.
- [x] `C14` Implementado download/remocao em lote por categoria no mobile com progresso, cancelamento e execucao sequencial.
- [x] `C15` Implementado PDF viewer embutido no mobile (WebView + pdf.js) com suporte remoto e local.
- [x] `C16` Busca local melhorada no mobile com normalizacao, indice em memoria e ranking por relevancia.

## 🕒 Log de Execucoes do Codex
- `2026-02-07 10:49 (local)` Atualizados `README.md` e `TODO.md` para refletir o estado atual do monorepo, arquitetura, fluxo de dados e plano de execucao. Tarefas impactadas: `C1`, `C2`, `C3`, `C4`, `C5`, `C6`, `C7`, `B1`, `B2`, `B3`, `B4`, `B5`.
- `2026-02-07 11:15 (local)` Implementado contrato de catalogo em `packages/shared` com TypeScript + Zod (`types.ts`, `schema.ts`, `index.ts`, `tsconfig.json`) e validado com `npx tsc --noEmit`. Tarefas impactadas: `C8`, `B3`.
- `2026-02-07 11:29 (local)` Criada pasta `database/` com scripts SQL versionados (`001_tables.sql` a `006_seed_dev.sql`) e `database/README.md`, cobrindo tabelas, checks, trigger de `updated_at`, indices, RLS, policies e bucket `content`. Tarefas impactadas: `C9`, `B4`.
- `2026-02-07 12:38 (local)` Implementado Admin MVP em `apps/admin` com Supabase Auth (login/logout por email/senha), AuthGate, CRUD de categorias/itens, filtros de itens, upload com upsert para bucket `content` e validacao por `@bizu/shared` antes de gravar e ao ler. Tarefas impactadas: `C10`.
- `2026-02-07 13:29 (local)` Integrado `apps/mobile` ao Supabase para leitura publica com sync manual, validacao via `@bizu/shared`, cache local em AsyncStorage, rota de categoria e telas Home/Search/Detail/Admin consumindo dados reais do cache. Tarefas impactadas: `C11`, `B5`.
- `2026-02-07 14:10 (local)` Implementado download offline de midia no mobile (`expo-file-system` + cache `downloads.map`), com abertura local/remota no detalhe, indicador "Offline" nas listas e contagem/limpeza de downloads na tela Admin/Diagnostico. Tarefas impactadas: `C12`.
- `2026-02-07 14:38 (local)` Migrado audio do mobile de `expo-av` para `expo-audio` (play/pause com fonte local/remota e reset apos fim), removido `expo-av` das dependencias, e simplificado `apps/mobile/metro.config.js` removendo overrides de monorepo nao essenciais. Tarefas impactadas: `C13`.
- `2026-02-07 15:15 (local)` Implementado lote por categoria no mobile (`batchDownload.ts`) com download/remocao sequencial, progresso `X/Y`, estado (baixando/cancelado/erro), botao de cancelamento e atualizacao imediata dos indicadores offline na tela de categoria. Tarefas impactadas: `C14`.
- `2026-02-07 15:38 (local)` Implementado viewer PDF embutido em `apps/mobile/app/pdf.tsx` usando `react-native-webview` + assets locais `assets/pdfjs`, com abertura a partir do detalhe do item para PDF remoto e PDF local via fallback base64/postMessage. Tarefas impactadas: `C15`.
- `2026-02-07 15:57 (local)` Melhorada busca local em `apps/mobile` com normalizacao acento-insensivel, indice em memoria no contexto, ranking por campos (titulo/tags/descricao/text_body), limite top 50 e destaque simples do termo no titulo. Tarefas impactadas: `C16`.
