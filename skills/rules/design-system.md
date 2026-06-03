# Design System — Universidade Suri

## Paleta de Cores

### Night Blue (padrão, dark)
| Token | HSL | Uso |
|---|---|---|
| `--background` | `236 100% 5%` | Fundo da aplicação |
| `--foreground` | `0 0% 100%` | Texto principal |
| `--primary` | `245 100% 55%` | Azul elétrico (botões, destaques) |
| `--secondary` | `130 100% 45%` | Verde neon (badges, sucesso) |
| `--card` | `236 80% 10%` | Fundo de cards |
| `--border` | `240 70% 30%` | Bordas |
| `--muted-foreground` | cinza suave | Texto secundário |

### Snow Blue (light)
| Token | HSL | Uso |
|---|---|---|
| `--background` | `205 60% 97%` | Fundo |
| `--foreground` | `220 30% 15%` | Texto |
| `--primary` | `200 90% 36%` | Azul clássico |
| `--secondary` | `200 85% 50%` | Ciano luminoso |
| `--card` | `0 0% 100%` | Cards brancos |
| `--border` | `210 25% 87%` | Bordas suaves |

## Tipografia
- Fonte: `Sora` (Google Fonts)
- Base: `13.5px` | Ultrawide (≥1536px): `15px` | Mobile (<480px): `13px`

## Classes Utilitárias
- `.bg-gradient-card` — glassmorphism com backdrop-blur
- `.bg-gradient-hero` — gradiente hero para avatares/banners
- `.text-gradient` — texto com gradiente primary → secondary
- `.hover-lift` — elevação com translateY(-4px) + shadow-glow
- `.fade-in-up` — animação de entrada suave
- `.stagger-children` — animação em cascata para elementos filhos
- `.watermark-bg` — marca d'água TOTVS (opacidade 0.025, rotação 15deg)
- `.pulse-glow` — pulsação com brilho (usado no módulo atual do roadmap)
- `.shadow-glow` — sombra com brilho primary
- `.transition-smooth` — transição padrão (150ms ease)

## Componentes Base (Shadcn/Radix UI)
Localização: `frontend/src/components/ui/`
- `Button`, `Card`, `Badge`, `Input`, `Label`
- `Dialog`, `Tabs`, `Progress`, `Separator`
- `Sheet`, `Skeleton`, `Switch`, `Textarea`, `Tooltip`
- Notificações: `toast` via `sonner` (`import { toast } from "sonner"`)

## Responsividade
- Mobile first. Testar em: 375px, 428px, 768px, 1280px.
- Sidebar colapsa para bottom nav em `< md (768px)`.
- Grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-[N]`
- Header: `h-14` mobile | `h-16` desktop
- Padding de páginas: `px-3 sm:px-4 md:px-8`, `py-5 md:py-8`

## Ícones
- Sempre importar de `lucide-react`.
- Tamanhos: `size-4` (inline), `size-5` (botões/labels), `size-6` (cards), `size-8` (estados vazios).
