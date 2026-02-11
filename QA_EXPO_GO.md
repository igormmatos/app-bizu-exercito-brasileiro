# QA Expo Go — A2 (Stabilization/QA)

## Metadados da execução

- Data da execução:
- Responsável:
- Dispositivo(s):
- Sistema operacional:
- Versão do app:
- Build/commit de referência:

## Convenção de preenchimento

- Status: `ok` | `erro` | `nao testado`
- Evidência: print, vídeo, log, observação textual curta
- Notes: detalhes de reprodução, contexto, comportamento esperado vs observado

## Checklist ponta a ponta (seção 3 do PLAN.md)

### 1) Navegação base

- Passos:
  - Abrir tabs `Home`, `Favoritos`, `Sugestao`.
  - Abrir rotas `/search`, `/category/[id]`, `/item/[id]`, `/pdf`, `/admin`.
  - Navegar ida/volta entre telas.
- Resultado esperado:
  - Todas as telas abrem sem erro de rota.
- Status: `nao testado`
- Evidência:
- Notes: 
1. ajustar o layout da exibição do pdf, para não conflitar com o notch. igual foi feito na tela inicial.
2 o layout do leitor de pdf deve ser ajustado. Alguns comandos como o de zoom não estão sendo aplicados.
2.1 acesso rápido, deve ser mais dinâmico. Ele deve exibir os ultimos arquivos abertos.
3. ao abrir a busca, e tentar voltar, ele fica em loop voltando para a tela de busca e não volta para a tela inicial nunca. 
3.1 talvez só exibir a pagina de busca depois de digitar e apertar o enter, ou deixar de forma mais fluida a transição.
  

### 2) Sync inicial e re-sync

- Passos:
  - Acessar `/admin`.
  - Tocar `Sincronizar agora`.
  - Aguardar conclusão.
  - Repetir `Sincronizar agora` após pequeno intervalo.
- Resultado esperado:
  - Dados carregam e o re-sync não quebra o estado local.
- Status: `nao testado`
- Evidência:
- Notes:

### 3) Offline após sync

- Passos:
  - Executar sync completo.
  - Ativar modo avião.
  - Navegar por Home, categorias, detalhe e busca.
- Resultado esperado:
  - Conteúdo em cache permanece acessível offline.
- Status: `nao testado`
- Evidência:
- Notes:

### 4) Download individual (pdf/audio/image)

- Passos:
  - Baixar 1 item PDF, 1 item áudio e 1 item imagem.
  - Abrir cada item na tela de detalhe.
- Resultado esperado:
  - Mídia abre localmente quando já baixada.
- Status: `nao testado`
- Evidência:
- Notes:

### 5) Lote por categoria

- Passos:
  - Em uma categoria, executar `Baixar categoria`.
  - Acompanhar progresso `X/Y`.
  - Testar cancelamento.
  - Executar remoção em lote.
- Resultado esperado:
  - Progresso correto, cancelamento funcional e estado final consistente.
- Status: `nao testado`
- Evidência:
- Notes:

### 6) Favoritos

- Passos:
  - Favoritar e desfavoritar itens em telas diferentes.
  - Fechar e reabrir o app.
  - Validar tab `Favoritos`.
- Resultado esperado:
  - Favoritos persistem corretamente.
- Status: `nao testado`
- Evidência:
- Notes:

### 7) Bizu do Dia

- Passos:
  - Verificar card de Bizu do Dia.
  - Reiniciar o app no mesmo dia.
  - Comparar item exibido.
- Resultado esperado:
  - Item permanece estável durante o mesmo dia.
- Status: `nao testado`
- Evidência:
- Notes:

### 8) Sugestão anônima

- Passos:
  - Enviar sugestão válida com rede.
  - Repetir fluxo sem rede para validar erro.
- Resultado esperado:
  - Sucesso com rede; mensagem de erro adequada sem rede.
- Status: `nao testado`
- Evidência:
- Notes:

### 9) Admin técnico (`/admin`)

- Passos:
  - Executar `Limpar cache`.
  - Executar `Limpar downloads`.
  - Executar `Recalcular Bizu do Dia`.
- Resultado esperado:
  - Ações executam sem quebrar catálogo/estado global.
- Status: `nao testado`
- Evidência:
- Notes:

### 10) Busca e ranking

- Passos:
  - Buscar termos com acento e sem acento.
  - Buscar com variação de caixa (maiúscula/minúscula).
  - Verificar ordem de relevância dos resultados.
- Resultado esperado:
  - Resultados relevantes com normalização acento-insensível.
- Status: `nao testado`
- Evidência:
- Notes:

## Resumo final da rodada

- Total `ok`:
- Total `erro`:
- Total `nao testado`:
- Bloqueadores:
- Próxima ação recomendada:
