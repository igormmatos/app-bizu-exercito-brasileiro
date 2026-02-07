# Database SQL (Supabase)

Esta pasta versiona os scripts SQL para executar manualmente no Supabase SQL Editor.

## Ordem de execucao
1. `database/001_tables.sql`
2. `database/002_indexes.sql`
3. `database/003_rls.sql`
4. `database/004_policies.sql`
5. `database/005_storage.sql`
6. `database/006_seed_dev.sql` (opcional, apenas ambiente de desenvolvimento)
7. `database/007_suggestions_tables.sql`
8. `database/008_suggestions_rls.sql`
9. `database/009_suggestions_policies.sql`

## O que cada script faz
- `001_tables.sql`: cria `public.categories` e `public.items`, checks de consistencia, funcao/trigger de `updated_at`.
- `002_indexes.sql`: cria indices essenciais para filtros por categoria/publicacao e indice GIN de tags.
- `003_rls.sql`: habilita RLS nas tabelas de catalogo.
- `004_policies.sql`: cria politicas para leitura publica apenas de publicados e escrita apenas para `authenticated`.
- `005_storage.sql`: cria bucket `content` como publico (quando permitido) e politicas de objetos no bucket.
- `006_seed_dev.sql`: insere dados ficticios de exemplo (dev only).
- `007_suggestions_tables.sql`: cria `public.suggestions` com checks de tamanho e status.
- `008_suggestions_rls.sql`: habilita RLS em `public.suggestions`.
- `009_suggestions_policies.sql`: permite insert para `anon`, leitura para `authenticated` e update de `status` para `authenticated`.

## Permissoes e storage
- Os scripts assumem execucao no SQL Editor com permissao administrativa.
- Se `005_storage.sql` falhar por permissao/politica do projeto:
  - Crie manualmente no Dashboard um bucket `content` como `Public`.
  - Caminhos sugeridos:
    - `pdf/<itemId>/<arquivo>.pdf`
    - `audio/<itemId>/<arquivo>.mp3`
    - `image/<itemId>/<arquivo>.jpg`
  - Observacao de seguranca: objetos em bucket publico ficam acessiveis por URL publica.
