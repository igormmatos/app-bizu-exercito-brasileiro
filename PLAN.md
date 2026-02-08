# PLAN — Bizu de Bolso do EB

## 1. Estado Atual (Inventário)

- Mobile (Expo + Expo Router) já implementa:
  - Sincronização de catálogo com cache local (offline-first).
  - Downloads offline por item (pdf/audio/image).
  - Download e remoção em lote por categoria (com progresso/cancelamento).
  - Viewer PDF embutido com WebView + pdf.js (remoto e local).
  - Busca local com normalização e ranking por relevância.
  - Favoritos offline-first com persistência local.
  - Bizu do Dia com seleção diária determinística.
  - Sugestões com insert anônimo.
  - Safe area/notch aplicado.
- Admin (React/Vite) já implementa:
  - Autenticação com Supabase.
  - Dashboard e shell administrativa.
  - CRUD de categorias e itens.
  - Upload e URL pública via bucket `content`.
  - Gestão de sugestões (listagem e atualização de status).
  - Auditoria longa operacional.
- Shared/Database:
  - `packages/shared` com contratos TypeScript + Zod.
  - SQL versionado em `database/001..009` (tabelas, índices, RLS, policies, storage, sugestões).

## 2. Riscos e Pontos de Atenção

| ID | Risco | Severidade | Mitigação |
|---|---|---|---|
| R1 | PDF local no iOS/WebView (`file://` + fallback base64) pode ter regressões entre versões de SO/WebView. | Alta | Validar em iOS real (build release), incluir testes de abertura remota/local e fallback. |
| R2 | Crescimento de armazenamento local por downloads offline. | Média | Definir política de limpeza/limite, orientar uso de `Limpar downloads`, medir tamanho por categoria. |
| R3 | Falhas de rede durante sync e batch podem gerar estado parcialmente atualizado. | Média | Checklist de retry/re-sync, mensagens de erro claras, validação em rede instável. |
| R4 | Divergência de RLS/policies entre ambientes Supabase (dev/prod). | Alta | Aplicar SQL versionado na mesma ordem, checklist de permissões por ambiente. |
| R5 | Bucket `content` público expõe URLs de objetos por design. | Alta | Revisar conteúdo permitido, convenção de paths, governança de upload e revisão de dados sensíveis. |
| R6 | Ausência de `.env.example` no mobile gera risco de onboarding/config drift. | Média | Criar `.env.example` e alinhar documentação de variáveis obrigatórias. |
| R7 | Ausência de `eas.json` deixa pipeline de build sem padronização. | Alta | Definir perfis EAS (`development`, `preview`, `production`) com parâmetros mínimos. |
| R8 | `app.json` sem `ios.bundleIdentifier` e `android.package` bloqueia publicação. | Alta | Definir IDs finais e validar assinatura/build por plataforma. |
| R9 | Build do admin com chunk grande (>500 kB) impacta carregamento web. | Média | Planejar code splitting pós-release móvel (sem bloquear publicação do app). |
| R10 | README raiz cita `supabase/` enquanto projeto usa `database/`. | Baixa | Atualizar documentação raiz para refletir estrutura real e evitar confusão operacional. |

## 3. Checklist de Qualidade (Expo Go)

| Item | Passo rápido | Resultado esperado |
|---|---|---|
| Navegação base | Abrir tabs Home/Favoritos/Sugestão e rotas `/search`, `/category/[id]`, `/item/[id]`, `/pdf`, `/admin`. | Todas as telas abrem sem erro de rota. |
| Sync inicial e re-sync | Em `/admin`, tocar `Sincronizar agora` duas vezes (com intervalo). | Dados carregam e re-sync não quebra estado local. |
| Offline após sync | Sincronizar, ativar modo avião e navegar no app. | Conteúdo em cache permanece acessível. |
| Download individual | Baixar 1 PDF, 1 áudio e 1 imagem; abrir em detalhe. | Mídia abre localmente quando baixada. |
| Lote por categoria | Executar baixar/remover lote e testar cancelamento. | Progresso correto, cancelamento funcional, estado final consistente. |
| Favoritos | Favoritar/desfavoritar itens em telas diferentes e reabrir app. | Lista de favoritos persiste corretamente. |
| Bizu do Dia | Verificar card no mesmo dia e reiniciar app. | Item permanece estável no mesmo dia. |
| Sugestão anônima | Enviar sugestão válida e testar erro sem rede. | Sucesso com rede; mensagem de erro adequada sem rede. |
| Admin técnico | Usar `/admin` para limpar cache/downloads e recalcular bizu. | Ações executam sem quebrar catálogo. |
| Busca e ranking | Buscar termo com e sem acento/case diferente. | Resultados relevantes com normalização acento-insensível. |

## 4. Checklist de Qualidade (Build)

| Item | O que validar em build Android/iOS real | Resultado esperado |
|---|---|---|
| Ícone e splash | Instalação do app em build release. | Ícone final e splash corretos em ambos os sistemas. |
| Permissões | Abertura de mídia/download e prompts nativos. | Prompts e fluxos de permissão coerentes por plataforma. |
| Deep link/scheme | Abrir via scheme configurado. | App resolve rota esperada sem crash. |
| Performance | Scroll/listas/player/pdf em dispositivo real. | Fluidez aceitável para uso em campo. |
| Tamanho do app | Verificar tamanho final do binário. | Dentro de limite definido para distribuição. |
| Background/retomada | Colocar em background e voltar durante uso de mídia/cache. | Estado mantém consistência sem travas. |
| Compatibilidade OS | Testar em versões mínimas alvo iOS/Android. | Funcionalidades críticas operam nas versões suportadas. |

## 5. Plano Incremental (Tarefas)

### Fase A — Stabilization/QA

| ID | Descrição | Critério de conclusão (verificável) | Comandos de validação |
|---|---|---|---|
| A1 | Rodar baseline técnico mobile/admin/shared. | `typecheck/build` passam; falhas documentadas. | `npm -w apps/mobile run start -- --web`, `cd apps/mobile && npx tsc --noEmit`, `npm -w apps/admin run build`, `npm -w packages/shared run typecheck` |
| A2 | Executar checklist Expo Go ponta a ponta. | Todos os itens do checklist marcados com status (`ok/erro`) e evidência. | Execução manual + registro em relatório de QA. |
| A3 | Validar fluxo offline completo em modo avião. | Home/Favoritos/Busca/Detalhe operam só com cache após sync. | Execução manual em dispositivo real. |
| A4 | Validar sugestões (insert anon + leitura admin autenticada). | Sugestão criada no mobile aparece no admin e status atualiza. | Execução manual + consulta no admin. |
| A5 | Consolidar relatório de bugs sem correção de código. | Documento de bugs priorizado (severidade/impacto/reprodução). | `git status --short` (sem mudanças fora de docs). |

### Fase B — Release Prep

| ID | Descrição | Critério de conclusão (verificável) | Comandos de validação |
|---|---|---|---|
| B1 | Definir IDs finais (`ios.bundleIdentifier`, `android.package`). | IDs aprovados e documentados para assinatura/publicação. | Revisão de config + checklist de release. |
| B2 | Criar/padronizar `eas.json` e perfis de build. | Perfis `development/preview/production` definidos e revisados. | `eas build:configure` / revisão de arquivo. |
| B3 | Preparar e validar assets (icon/splash/adaptive). | Assets finais exportados e conferidos em build real. | Build preview e inspeção visual. |
| B4 | Definir versionamento (`version`, `versionCode`, `buildNumber`). | Estratégia de incremento documentada e aplicada. | Build com metadados corretos. |
| B5 | Criar `.env.example` e alinhar documentação de env. | Onboarding sem dependência de `.env.local` pessoal. | Setup limpo em máquina nova/documentada. |
| B6 | Criar runbook de logs e monitoramento de build. | Documento com comandos, localização de logs e troubleshooting base. | Execução guiada de build e revisão de logs. |

### Fase C — Store Submission

| ID | Descrição | Critério de conclusão (verificável) | Comandos de validação |
|---|---|---|---|
| C1 | Montar listing (descrições, categoria, keywords). | Textos finais aprovados por plataforma. | Checklist de conteúdo concluído. |
| C2 | Gerar screenshots por plataforma/dispositivo. | Pacote de screenshots atende requisitos das lojas. | Revisão em checklist App Store/Play Console. |
| C3 | Publicar política de privacidade e URL pública. | URL pública acessível e referenciada no listing. | Verificação de acesso HTTP + checklist de store. |
| C4 | Preencher data safety/privacy labels. | Formulários completos, coerentes com uso real de dados. | Revisão cruzada legal/produto/técnica. |
| C5 | Rodar checklist final de submissão (go/no-go). | Sem blockers críticos pendentes para envio. | `git status --short` + checklist final assinado. |

## 6. Decisões Pendentes

- Bundle ID iOS final.
- Package Android final.
- Estratégia de lançamento: Android primeiro, iOS primeiro, ou simultâneo.
- Nível de rollout inicial (percentual e países-alvo).
- Política de retenção/limpeza para downloads offline.
- Fonte pública da política de privacidade (domínio final).

## 7. Gaps — Expo Go vs Build vs Publicação

- Expo Go NÃO valida completamente:
  - Ícone/splash finais empacotados.
  - Permissões reais de loja e prompts finais por sistema.
  - Comportamento pós-assinatura do binário.
  - Deep links/schemes finais no app assinado.
  - Push/APNs/FCM (quando aplicável).
  - Performance real de release (AOT/minificação/otimizações).
- Build valida:
  - Assets empacotados no binário.
  - Prompts/permissões reais.
  - Comportamento nativo real em iOS/Android.
  - Assinatura e pacote final.
  - Tamanho real do app.
- Publicação exige:
  - Política de privacidade pública.
  - Listing completo e consistente.
  - Screenshots por plataforma.
  - IDs finais (`bundleIdentifier`/`package`) e versionamento.
  - Declarações de segurança/privacidade (Data Safety / Privacy Labels).

## 8. Comandos, Logs e Evidências

- Comandos base de validação:
  - `npm -w apps/mobile run start -- --web`
  - `cd apps/mobile && npx tsc --noEmit`
  - `npm -w apps/admin run build`
  - `npm -w packages/shared run typecheck`
  - `git status --short`
- Onde olhar logs/evidências:
  - Saída do terminal local/CI.
  - Logs do Expo/Metro no start do mobile.
  - Artefatos de build web em `apps/admin/dist`.
  - Estado de alterações em `git status`.

## 9. Testes e Cenários de Aceite

1. Cenário funcional Expo Go:
   - Dado app sincronizado, quando ativar modo avião, então Home/Favoritos/Busca/Detalhe continuam utilizáveis com cache.
   - Dado item de mídia baixado, quando abrir detalhe, então a versão local é usada preferencialmente.
   - Dado sugestão enviada, então persiste em `public.suggestions` e aparece no admin autenticado.
2. Cenário build readiness:
   - Dado build Android/iOS, então ícone/splash/permissões/deep link se comportam conforme esperado.
   - Dado versionamento definido, então binários saem com incrementos corretos.
   - Dado checklist de submissão completo, então pacote está apto para envio.
3. Cenário de governança:
   - `git status --short` mostra apenas docs alteradas nesta etapa.
   - Nenhum arquivo de app/schema é modificado.

## 10. Assunções e Defaults

- Idioma do plano: PT-BR.
- Timestamp do log em `TODO.md`: `YYYY-MM-DD HH:MM (local)`.
- Sem correções de código nesta etapa, apenas documentação.
- Decisões não fechadas ficam explicitamente em `Decisões Pendentes`.
