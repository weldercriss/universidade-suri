# Design System & Identidade Visual

O design da **Universidade Suri** é moderno, imersivo e altamente responsivo, com estética
corporativa azul (**Suri Blue**), efeitos de vidro (glassmorphism) e micro-animações.

> **Fonte da verdade**: os tokens reais vivem em `src/styles.css` (Tailwind CSS v4,
> sintaxe `@theme` + `@layer base`). Sempre confira lá antes de citar uma cor. Este documento
> espelha o estado atual do `styles.css`.

---

## Temas e Tokens de Cor (HSL)

As cores são declaradas em HSL (sem `hsl()` em volta — para controle de opacidade via Tailwind v4),
em `src/styles.css`. Há dois temas, alternados pela classe `.dark` no elemento raiz
(`@custom-variant dark (&:is(.dark *))`). Os nomes de marca são **Snow Blue** (claro) e
**Night Blue** (escuro).

### A. Tema Claro (Snow Blue) — `:root`
| Token | Valor HSL | Descrição |
|-------|-----------|-----------|
| `--background` | `218 42% 91%` | Azul-lavanda suave |
| `--foreground` | `222 25% 10%` | Quase preto (legibilidade) |
| `--card` | `0 0% 100%` | Branco puro |
| `--primary` | `234 85% 45%` | Azul primário vibrante |
| `--secondary` | `237 90% 63%` | **Suri Blue** |
| `--success` | `127 100% 36%` | Verde WhatsApp |
| `--border` | `218 22% 82%` | Cinza-azulado claro |
| `--radius` | `1.5rem` | Raio base dos cantos |

### B. Tema Escuro (Night Blue) — `.dark`
| Token | Valor HSL | Descrição |
|-------|-----------|-----------|
| `--background` | `222 22% 8%` | Escuro neutro levemente azulado |
| `--foreground` | `218 38% 93%` | Branco-azulado |
| `--card` | `222 22% 11%` | Card levemente mais claro |
| `--primary` | `237 90% 65%` | Suri Blue (mais vibrante no dark) |
| `--secondary` | `237 90% 68%` | Suri Blue claro |
| `--border` | `222 18% 21%` | Borda escura |

### C. Cores de marca extras (`@theme inline`)
- `--color-snow: 205 100% 95%`
- `--color-deep: 233 87% 5%`
- `--color-marine: 234 100% 30%`
- `--color-suri: 237 100% 65%`
- Apps/módulos: `--app-connect #00b914`, `--app-calc #25d366`, `--app-vext #4a54ff`,
  `--app-work #2e1de8`, `--app-template #000f9b`

---

## Tipografia e Escala de Fonte

- **Fonte**: `'Sora'` (Google Fonts, pesos 300–800), via `--font-sans` / `--font-display`
- **Escala base responsiva** (no elemento `html`):
  ```css
  html { font-size: 14px; }
  @media (min-width: 1536px) { html { font-size: 15px; } }
  ```
- Cabeçalhos (`h1`–`h4`) usam `--font-display` (Sora)

---

## Gradientes e Classes Utilitárias

Definidas em `@layer base` no `styles.css`:

| Classe | Efeito |
|--------|--------|
| `.bg-gradient-card` | Glassmorphism: `var(--gradient-card)` + `backdrop-filter: blur(16px)` + bordas semitransparentes |
| `.bg-gradient-brand` | Gradiente de marca primary→secondary |
| `.bg-gradient-whats` | Gradiente verde WhatsApp |
| `.text-gradient` | Texto com clip de gradiente primary→secondary |
| `.text-gradient-brand` | Texto com clip success→primary |
| `.glass` | Vidro simples |
| `.glass-card` | Vidro theme-aware (`.dark` aware) |
| `.shadow-elegant` | Sombra elegante |
| `.shadow-glow` | Sombra com glow (muda por tema via `--shadow-glow`) |
| `.hover-lift` | `translateY(-4px)` + `--shadow-glow` no hover |
| `.animated-gradient` | Animação de gradiente |
| `.pulse-glow` | Animação de pulsação com glow |
| `.fade-in-up` | Fade in com movimento para cima |

### Variáveis de gradiente
`--gradient-hero`, `--gradient-glow`, `--gradient-card`, `--gradient-brand`, `--gradient-whats`.
No tema escuro o `body` recebe dois `radial-gradient` de Suri Blue de baixa opacidade.

---

## Marca d'Água Corporativa (TOTVS)

`.watermark-bg` (logo `/totvs.svg` em `public/`):
- Fixa no canto inferior direito (`bottom: -25%`, `right: -8%`), `width: 75vw` (max `900px`)
- Opacidade `0.12` no tema claro, `0.08` no escuro; rotação `20deg`; `pointer-events: none`

---

## Biblioteca de Ícones

- Uso **exclusivo** de **`lucide-react`** — nunca importar ícones de outra biblioteca

### Ícones por contexto
| Contexto | Ícone |
|----------|-------|
| Grupo VIP | `Sparkles` |
| Grupo Embaixador | `Shield` |
| Admin | `ShieldCheck` |
| Gamificação / XP | `Zap` |
| Tour / Ajuda | `HelpCircle` |
| Webchat mobile | `MessageCircle` |

---

## Responsividade

- **Mobile first** — desenvolver para mobile e escalar para desktop
- Breakpoints de teste: **375px**, **428px**, **768px**, **1280px**
- Sidebar retrátil em `app-shell.tsx`
- Layouts com flexbox/grid do Tailwind

---

## Componentes UI Base (`src/components/ui/`)

Baseados em Radix UI via shadcn/ui. Não criar componentes base do zero — usar ou customizar os existentes:

- `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`
- `dialog.tsx`, `sheet.tsx`, `drawer.tsx`
- `tabs.tsx`, `badge.tsx`, `avatar.tsx`
- `sonner.tsx` — sistema de toast (Sonner)
- `progress.tsx`, `slider.tsx`, `switch.tsx`
- `dropdown-menu.tsx`, `select.tsx`, `command.tsx`

---

## Relacionado

- Padrões de código e loading/erros: `architecture.md`
- Exibição de grupos/tiers: `user-groups.md`
