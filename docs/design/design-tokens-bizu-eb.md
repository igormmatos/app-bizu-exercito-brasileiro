# Design Tokens — Bizus do Exército Brasileiro
**Versão:** 1.0  
**Escopo:** App Mobile (prioritário) + Admin (derivado)  
**Objetivo:** identidade institucional, legível, pronta para uso em campo

---

## 1. Princípios Visuais (não negociáveis)
- Institucional, não lúdico
- Alta legibilidade em ambientes externos
- Contraste acima de estética
- Hierarquia clara > efeitos visuais
- Consistência > variedade

---

## 2. Paleta de Cores (Tokens)

### 2.1 Brand — Army Scale
| Token | Hex | Uso |
|---|---|---|
| `army-900` | `#26392D` | Header, Sidebar, Estrutura |
| `army-800` | `#2F4A3A` | Estados ativos escuros |
| `army-700` | `#355C45` | Hover / destaque secundário |
| `army-600` | `#40694D` | **Ações primárias** |
| `army-500` | `#4F7C5E` | Ícones ativos |
| `army-100` | `#E6EFE9` | Fundo leve institucional |

**Regra:** Verde militar é estrutural (não decorativo).

### 2.2 Neutros
| Token | Hex | Uso |
|---|---|---|
| `gray-900` | `#111827` | Títulos |
| `gray-700` | `#374151` | Texto principal |
| `gray-500` | `#6B7280` | Metadados |
| `gray-300` | `#D1D5DB` | Dividers |
| `gray-100` | `#F3F4F6` | Fundo do app |
| `white` | `#FFFFFF` | Cards / superfícies |

### 2.3 Semântica por Tipo de Conteúdo
| Tipo | Primary | Background |
|---|---|---|
| 🎵 Áudio | `purple-600` `#7C3AED` | `purple-100` `#EDE9FE` |
| 📄 PDF | `red-600` `#DC2626` | `red-100` `#FEE2E2` |
| 🖼️ Imagem | `blue-600` `#2563EB` | `blue-100` `#DBEAFE` |
| 📝 Texto | `orange-600` `#EA580C` | `orange-100` `#FFEDD5` |

**Regra:** Ícone/badge/marcador sempre usa a cor do tipo.

### 2.4 Estados
| Estado | Cor |
|---|---|
| Sucesso | `green-600` |
| Aviso | `yellow-500` |
| Erro | `red-600` |
| Offline | `gray-500` |

---

## 3. Tipografia (Tokens)

### 3.1 Fonte Base
- Sans-serif do sistema (iOS: San Francisco, Android: Roboto)

### 3.2 Hierarquia Tipográfica
| Uso | Token | Estilo |
|---|---|---|
| Título principal | `text-xl` | `font-bold`, `gray-900` |
| Título de seção | `text-lg` | `font-semibold` |
| Corpo | `text-base` | `gray-700` |
| Metadados | `text-xs` | `uppercase`, `gray-500`, tracking-wide |

### 3.3 Letras de Música (Exceção — somente type=audio)
- Fonte: serif
- Estilo: italic
- Alinhamento: center
- Line-height maior
- Cor: `gray-700`

**Regra:** Letras não usam sans-serif.

---

## 4. Espaçamento & Forma

### 4.1 Espaçamento
- Escala base: múltiplos de 4
- Containers: `p-4` (padrão), `p-6` (seções principais)
- Gaps: `gap-3` / `gap-4`

### 4.2 Bordas & Forma
| Elemento | Forma |
|---|---|
| Botões | `rounded-lg` |
| Cards | `rounded-xl` |
| Badges | `rounded-full` |
| Ícones | círculo com fundo semântico |

**Regra:** Nada de cantos exageradamente arredondados.

---

## 5. Componentes-Chave (Regras Visuais)

### 5.1 Category Card (App)
- Fundo branco
- Ícone em círculo colorido (semântica do tipo)
- Nome centralizado + contador discreto
- Interação: `active:scale-95`

### 5.2 Content List Item
- Card branco
- Ícone semântico à esquerda
- Título truncado (1 linha) + metadados abaixo
- Feedback ao toque imediato

### 5.3 Audio Player
- Play/Pause hero (grande)
- Barra de progresso + tempos atual/total
- Letra em scroll (estilo cancioneiro)

### 5.4 Action Button (Primary)
- Fundo: `army-600`
- Texto: branco
- Pressed/hover: `army-700`
- Disabled: `opacity-50`

---

## 6. Header & Tabs (prévia de aplicação)

### Header (App)
- Sticky
- Fundo: `army-900`
- Título à esquerda (branco)
- Status Offline à direita
- Busca integrada (campo claro sobre fundo escuro)

### Tabs (App)
- Home
- Favoritos
- Sugestão

Ativo: `army-600`  
Inativo: `gray-500`

---

## 7. Anti-padrões
- Sem gradientes
- Sem sombras pesadas
- Sem cores fora da paleta
- Sem tipografia decorativa
- Sem gamificação visual
