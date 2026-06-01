# Guia de Estilo (Style Guide)

Este documento descreve toda a identidade visual, padrões de interface e especificações de design da plataforma **Suri Tools**.

---

## 🎨 Sistema de Cores

Todas as cores fundamentais são declaradas utilizando o formato **HSL** na camada de base do CSS (`src/index.css`), o que permite controle modular e suporte nativo ao **Tema Escuro (Dark Mode)**.

### Cores Base (Tema Claro vs Tema Escuro)

| Variável CSS | Descrição | Tema Claro (HSL) | Tema Escuro (HSL) |
| :--- | :--- | :--- | :--- |
| `--background` | Cor de fundo da aplicação | `205 100% 95%` (Snow Blue) | `233 87% 5%` (Deep Blue) |
| `--foreground` | Texto principal | `233 87% 5%` (Deep Blue) | `205 100% 95%` (Snow Blue) |
| `--primary` | Azul Marinho (Principal) | `234 100% 30%` (Marine Blue) | `234 100% 30%` (Marine Blue) |
| `--secondary` | Azul Suri (Secundário) | `237 100% 65%` (Suri Blue) | `237 100% 65%` (Suri Blue) |
| `--card` | Fundo de cartões/painéis | `0 0% 100%` (Branco) | `233 87% 8%` (Deep Blue Claro) |
| `--muted` | Elementos desativados/sutis | `205 100% 90%` | `233 40% 15%` |
| `--border` | Bordas e divisores | `205 50% 85%` | `233 40% 20%` |
| `--success` | Verde Sucesso (WhatsApp) | `127 100% 36%` | `127 100% 36%` |

### Cores de Módulos (Cores de Destaque)

Cada módulo principal possui uma cor de destaque exclusiva para identidade visual:

- **Suri API (`--app-connect`)**: `#00b914` (Verde Conexão)
- **Suri Calcs (`--app-calc`)**: `#25d366` (Verde WhatsApp / Sucesso)
- **Kanban / VextFlow (`--app-vext`)**: `#4a54ff` (Azul Vibrante)
- **Flows (`--app-work`)**: `#2e1de8` (Azul Escuro Profundo)
- **Docs (`--app-template`)**: `#000f9b` (Azul Royal)

---

## 🔤 Tipografia e Escala

A tipografia padrão do projeto é a **Sora**, importada diretamente do Google Fonts.

- **Fonte Principal**: `'Sora', sans-serif`
- **Ajuste de Escala de Fonte (Densidade Visual)**:
  - Para melhorar a densidade de informação, a escala do elemento `html` é ajustada para `13.5px` por padrão (o que equivale visualmente a `~85%` de zoom em navegadores normais).
  - Em telas ultra-wide (`min-width: 1536px`), a escala é redefinida para `15px` para evitar visualização excessivamente pequena.

---

## ✨ Efeitos Visuais & Premium UX

### 1. Glassmorphic Cards e Painéis
A plataforma utiliza forte inspiração em glassmorfismo moderno para cartões e painéis com transparências, desfoques e sombras sutis:
- **`.glass-panel`**:
  ```css
  background: hsl(var(--card) / 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid var(--suri-border);
  border-radius: 16px;
  ```
- **`.glass-card`**:
  ```css
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 20px 0 rgba(99, 102, 241, 0.06);
  ```

### 2. Gradientes Radiais de Fundo
Tanto no tema claro quanto no escuro, o plano de fundo do `body` possui gradientes radiais dinâmicos e fixos, adicionando profundidade premium ao design global.

### 3. Marca d'Água de Identidade Visual
Implementado em todas as telas sob o layout principal (`HubLayout.tsx`), uma marca d'água flutuante gigante (`totvs.svg`) rotacionada a `15deg` com opacidade reduzida e animação de entrada de logo suave.

---

## 🛡️ Biblioteca de Ícones

O projeto utiliza a biblioteca **`lucide-react`** de forma consistente para manter os ícones leves, vetoriais e customizáveis por CSS.

### Ícones Recomendados por Contexto

- **Conectividade/API**: `Cable`
- **Cálculos/Preços**: `Calculator` ou `CircleDollarSign`
- **Fluxos/Processos**: `Workflow`
- **Documentação/Guias**: `BookOpen`
- **Ações e Feedback**:
  - Confirmação: `CheckCircle2`
  - Efeitos/Novidades: `Sparkles` ou `Star`
  - Instalação/Download: `Download`
  - Navegação: `ChevronLeft` ou `ArrowRight`

---

## 📐 Estruturas de Layout

1. **`app-container-simple`** (Utilizado pelo `HubLayout`): Layout sem barra lateral de rolagem, perfeito para visualizações em grade ou de painel único que ocupam exatamente `100vh` por `100vw`.
2. **`app-container`**: Layout completo preparado para barra lateral (`sidebar`) e cabeçalho fixo (`topbar`).
3. **`suri-topbar-solid`**: Topbar fixa de 48px para navegação de módulos com suporte a portais para cabeçalhos dinâmicos.
