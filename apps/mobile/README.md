# Mobile App (`apps/mobile`) - Web/PWA

Aplicacao do Bizu EB em Expo Router + TypeScript, operando em modo **web-first/PWA-only**.

## Pre-requisitos
- Node.js 20+
- npm 10+
- Navegador moderno (Chrome recomendado para validacao PWA)

## Variaveis de ambiente (Supabase publico)
Crie `apps/mobile/.env` (ou `.env.local`) com:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Tambem existe `apps/mobile/.env.example`.

## Arquitetura PWA (web-only)

Substituicoes aplicadas para compatibilidade total web:

- `expo-file-system` -> `fetch` + `Cache API` (downloads offline)
- `expo-audio` -> HTML5 Audio (controle de play/pause/seek/repeat)
- PDF viewer customizado -> abertura nativa do navegador (`window.open`)
- `Linking.openURL` -> `window.open` / `window.location`
- `react-native-youtube-iframe` -> embed web via `iframe` (`YoutubeEmbed.web.tsx`)

Dependencias mobile-only removidas do workspace `apps/mobile`:

- `expo-audio`
- `expo-file-system`
- `expo-linking`
- `expo-web-browser`
- `react-native-webview`
- `react-native-youtube-iframe`

## Como rodar localmente (dev web)

Na raiz do monorepo:

1. `npm install`
2. `npm -w apps/mobile run start -- --web --port 8082`

Observacao: em dev o service worker nao e registrado (comportamento intencional para nao poluir cache durante desenvolvimento).

## Build de producao (web export)

No workspace `apps/mobile`:

1. `npx expo export --platform web`

Saida gerada em:

- `apps/mobile/dist`

## Downloads offline (midia)

- Itens `pdf`, `audio` e `image` continuam baixaveis no detalhe do item.
- Os arquivos sao persistidos no `Cache API` (`bizu-downloads-v1`).
- O mapa de downloads continua em AsyncStorage (`downloads.map`).
- O `localUri` agora e virtual (`/__bizu-downloads__/...`) e resolvido no browser.

## PDF via navegador nativo

- Itens de PDF exibem somente a acao `Abrir PDF`.
- A abertura usa nova aba do navegador (`window.open(url, "_blank")`).
- O proprio navegador controla renderizacao, zoom, busca, navegacao e download.
- Para PDF baixado offline, o app resolve a URL cacheada antes de abrir.

## PWA

### Manifest + instalacao

- `public/manifest.webmanifest`
- `app/+html.tsx` com meta tags Android/iOS:
  - `theme-color`
  - `application-name`
  - `apple-mobile-web-app-*`
  - `apple-touch-icon`

### Service Worker

- Arquivo: `public/service-worker.js`
- Registro somente em producao (`NODE_ENV=production`)
- Estrategia:
  - precache de app shell e assets principais
  - `network-first` para navegacao com fallback para `offline.html`
  - `cache-first` para assets estaticos
  - suporte explicito ao prefixo `"/__bizu-downloads__/"`

### Offline fallback

- Arquivo: `public/offline.html`
- Mensagem padrao:
  - `Sem internet. Abra um conteudo ja acessado ou volte quando a conexao retornar.`

## Teste local da PWA (producao)

1. `npx expo export --platform web`
2. Servir `apps/mobile/dist` com servidor estatico (exemplo):
   - `npx serve apps/mobile/dist`
3. Abrir no Chrome e validar em `Application`:
   - Manifest
   - Service Workers
   - Cache Storage
4. Rodar Lighthouse com foco PWA.

## Deploy (Vercel / Netlify)

Publicar a pasta:

- `apps/mobile/dist`

Garantir que estes arquivos fiquem acessiveis na raiz publicada:

- `manifest.webmanifest`
- `service-worker.js`
- `offline.html`
- `icons/*`

## Limitacoes conhecidas

- iOS Safari possui limitacoes de instalacao/cache comparado ao Chrome Android.
- Conteudos nao acessados/baixados previamente podem cair no fallback offline.
- O comportamento offline de links externos depende de disponibilidade da origem.
- Bloqueadores de pop-up podem impedir abertura de PDF se o clique nao vier de gesto direto do usuario.
