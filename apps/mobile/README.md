# Mobile App (Expo)

Aplicativo mobile do Bizu EB em `apps/mobile`, com Expo Router e TypeScript.

## Pre-requisitos
- Node.js 20+
- npm 10+
- Expo Go instalado no celular (Android/iOS)

## Variaveis de ambiente (Supabase publico)
Crie `apps/mobile/.env` (ou `.env.local`) com:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Tambem existe um modelo em `apps/mobile/.env.example`.

## Como rodar localmente
Na raiz do monorepo:

1. Instalar dependencias:
   - `npm install`
2. Iniciar o Metro bundler:
   - `npm run start -w apps/mobile`
3. Abrir no dispositivo:
   - Escanear o QR Code com o Expo Go

## Comandos principais
- `npm run start -w apps/mobile`
- `npm run android -w apps/mobile`
- `npm run ios -w apps/mobile`
- `npm run web -w apps/mobile`

## Downloads offline (media)
- Itens `pdf`, `audio` e `image` podem ser baixados na tela de detalhe do item.
- Os arquivos ficam em `FileSystem.documentDirectory + "downloads/"`, organizados por tipo:
  - `downloads/pdf/`
  - `downloads/audio/`
  - `downloads/image/`
- O status de download e persistido em AsyncStorage (`downloads.map`).
- O playback de audio usa `expo-audio` (play/pause com fonte local quando baixado, remoto quando nao baixado).

## Remocao de downloads
- Na aba `Admin/Diagnostico`, use `Limpar downloads` para:
  - apagar arquivos locais da pasta `downloads/`
  - limpar o mapa de downloads no AsyncStorage

## Download por categoria
- Na tela de categoria, existe `Baixar categoria` para processar todos os itens elegiveis (`pdf`, `audio`, `image` com `storage_path`).
- O lote roda em modo sequencial (1 por vez), exibindo progresso (`X/Y`) e item atual.
- Em caso de falha de item, o lote continua e mostra resumo no final.
- Tambem existe `Remover downloads da categoria` para apagar os arquivos locais da categoria.

## PDF viewer embutido (WebView + pdf.js)
- A rota `app/pdf.tsx` abre PDFs dentro do app usando `react-native-webview`.
- Viewer local em `assets/pdfjs/` com `pdf.js` (assets versionados e copiados para `pdf.min.js`/`pdf.worker.min.js` em runtime).
- O detalhe do item (`item/[id]`) envia para `/pdf?uri=...`:
  - remoto: URL publica do Storage
  - local: `file://...` com fallback por base64 via `postMessage` para garantir renderizacao no viewer

## Busca local melhorada
- Busca acento-insensivel e case-insensitive (`normalize` com Unicode NFD + remocao de diacriticos).
- Indice leve em memoria no `CatalogContext`, recalculado quando o catalogo muda.
- Ranking por relevancia:
  - titulo: `startsWith +100`, `contains +60`
  - tags: `+40`
  - descricao: `+20`
  - text_body (itens text): `+10`
- Ordenacao por score desc e, em empate, titulo asc.
- Limite de retorno em top 50 para manter fluidez.

## Limitacao atual de PDF
- O viewer e propositalmente minimo (navegacao de pagina + zoom basico).
