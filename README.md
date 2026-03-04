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


# Arquitetura do Projeto — Estratégia PWA (MVP)

## Contexto

Inicialmente, o projeto foi concebido com a possibilidade de publicação como aplicativo nativo nas plataformas **Android** e **iOS**. No entanto, após análise técnica e estratégica da fase atual do desenvolvimento, foi definida uma mudança de direção arquitetural.

A aplicação passará a ser estruturada como um **PWA (Progressive Web App)**.

Essa decisão visa permitir uma entrega mais rápida do produto, reduzir custos iniciais e facilitar a evolução contínua da aplicação durante sua fase de validação.

---

# Por que PWA?

A adoção de PWA nesta fase do projeto traz benefícios importantes:

### 1. Redução de custos iniciais

A publicação em lojas exige custos e burocracias adicionais:

| Plataforma              | Custo                 |
| ----------------------- | --------------------- |
| Apple Developer Program | ~ US$ 99/ano          |
| Google Play Console     | ~ US$ 25 (taxa única) |

Como o projeto ainda está em fase de crescimento e validação, optou-se por evitar esses custos neste momento.

---

### 2. Iteração e atualização mais rápidas

Aplicações distribuídas em lojas precisam passar por processos de:

* build
* envio
* revisão
* aprovação
* publicação

Com um **PWA**, novas versões podem ser publicadas **imediatamente**, sem dependência de aprovação de terceiros.

Isso acelera significativamente o ciclo de evolução do projeto.

---

### 3. Validação do produto como MVP

O objetivo atual do projeto é consolidar uma **versão MVP funcional**, que permita:

* validar a utilidade da aplicação
* melhorar a experiência do usuário
* evoluir funcionalidades com feedback real

O PWA permite atingir esses objetivos de forma eficiente.

---

# O que é esperado com essa mudança

Após a refatoração para PWA, a aplicação deverá:

* funcionar diretamente no navegador
* permitir **instalação na tela inicial do dispositivo**
* abrir em **modo aplicativo (standalone)**
* possuir **suporte a funcionamento offline**
* manter **atualizações automáticas**

Na prática, o usuário poderá:

1. acessar a aplicação pelo link
2. instalar no celular
3. usar a aplicação como se fosse um app
4. continuar utilizando algumas funcionalidades mesmo sem internet

---

# Princípio fundamental da refatoração

A mudança para PWA **não altera o produto em si**.

A refatoração deve ser **estrutural**, não funcional.

Portanto, devem ser preservados integralmente:

* todas as funcionalidades existentes
* toda a estrutura de conteúdo
* layout e experiência visual
* rotas e fluxos de navegação
* estrutura do banco de dados
* categorias e conteúdos cadastrados
* embeds de vídeos oficiais
* textos e letras das canções
* qualquer funcionalidade já implementada

Em resumo:

> **Nada do que já foi construído deve ser removido ou simplificado.**

O objetivo é apenas **adaptar a aplicação para funcionar como PWA**.

---

# Resultado esperado

Ao final da refatoração, o projeto deverá:

* continuar funcionando exatamente como hoje
* possuir suporte completo a **Progressive Web App**
* permitir instalação no celular
* possuir suporte offline para conteúdos previamente acessados ou cacheados
* manter a mesma estrutura de conteúdo

Essa abordagem permite lançar o projeto como **MVP funcional**, mantendo o sistema evolutivo e de baixo custo operacional.

---

# Evolução futura

Caso o projeto evolua e seja necessário expandir sua distribuição, o PWA poderá posteriormente ser:

* empacotado como **aplicativo Android**
* convertido em **aplicativo iOS**
* publicado nas lojas oficiais

Tudo isso **sem necessidade de reescrever o sistema**, aproveitando a mesma base de código.

---

# Objetivo final

A adoção de PWA nesta fase do projeto busca:

* reduzir complexidade inicial
* acelerar entregas
* validar o produto rapidamente
* manter flexibilidade de evolução

Essa estratégia permite focar no que realmente importa neste momento:

> **construir uma aplicação sólida, útil e evolutiva.**