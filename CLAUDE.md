# Universidade Suri — Guia de Desenvolvimento

Monorepo educacional corporativo (TOTVS). Frontend React + Vite, backend NestJS + Prisma + PostgreSQL.

## Estrutura

```
universidade-suri/
├── frontend/          # SPA React 19 + Vite + Tailwind CSS
├── backend/           # API NestJS (Clean Architecture) + Prisma ORM
├── plan/              # Notas de desenvolvimento e histórico de issues
├── skills/      # Regras de negócio, design system e arquitetura (FONTE PRIMÁRIA)
└── docker-compose.yml # PostgreSQL local
```

## Comandos Essenciais

### Backend
```bash
cd backend
npm run start:dev    # servidor com hot reload (porta 3000)
npm run db:migrate   # roda migrações SQL
npm run db:seed      # cria admin: admin@suri.com / SuriAdmin123
```

### Frontend
```bash
cd frontend
npm run dev          # servidor Vite (porta 5173)
npm run build        # build de produção
```

## Regras do Projeto (SEMPRE consultar `skills/`)

As regras em `skills/` são a **fonte primária** de verdade. Em caso de conflito com comentários inline, prevalecem as regras.

### Autenticação
- Apenas e-mail + senha corporativo. Sem Google OAuth, sem SSO.
- JWT armazenado em `localStorage` com chave `suri_token`.
- Usuário serializado em `localStorage` com chave `nimbus_user`.

### Perfis de Usuário
- `groupType`: `"vip"` | `"embaixador"`
- `tier` VIP: `"VIP PLUS"`, `"VIP GOLD"`, `"VIP PLATINUM"`
- `tier` Embaixador: `"Embaixador Voice"`, `"Embaixador Elite"`, `"Embaixador Icon"`
- `isAdmin: true` → acesso ao painel admin, sem acesso a cursos/comunidade como aluno
- `company`: empresa do usuário (campo opcional, gerenciado pelo admin)
- `isFirstLogin`: `true` se o usuário não possui nenhum `ModuleProgress` — controla saudação e seção "Continue assistindo"

### Cursos e Progresso
- Aulas são sequenciais (antifraude): módulo N só disponível após N-1 concluído.
- Progresso rastreado em `module_progress` via `enrollment_id + module_id`.
- Conclusão de 100% → emissão automática de certificado (`SURI-AC-[HEX]`).

### Roadmap
- Conteúdos curados pelo admin (ex: "Dev Full Stack") com links de vídeos, documentos e referências.
- Visível para **todos** os usuários autenticados, sem filtro de grupo.
- Admin acessa via `/admin/roadmap`; o item "Roadmap" no nav redireciona automaticamente para lá.
- `isActive: false` oculta o roadmap dos usuários (toggle no painel admin).
- Itens têm `type`: `"video"` | `"document"` | `"reference"`, `title`, `url`, `description` (opcional).
- `GET /roadmaps` → ativos para usuário, todos para admin (branch por `req.user.isAdmin`).

### Comunidade
- Feed segmentado por `groupType`: VIPs veem apenas posts de VIPs, Embaixadores de Embaixadores.
- Admin vê todos os posts mas não pode publicar.
- Cada post publicado concede `+100 XP` ao autor.
- Comentários são sempre visíveis quando existem (`commentDetails.length > 0`), independente do toggle de input.

### Certificados
- Código único: `SURI-AC-[6 chars HEX]` (automático) ou `SURI-AC-MAN-[HEX]` (manual pelo admin).
- Validação pública: `GET /certificates/validate/:code` (sem autenticação).
- Endpoint do usuário: `GET /certificates/user` → `{ count, certificates[] }`.

## Design System (`skills/rules/design-system.md`)

### Paleta — Night Blue (padrão, dark)
| Token | HSL | Uso |
|---|---|---|
| `--background` | `236 100% 5%` | Fundo da aplicação |
| `--foreground` | `0 0% 100%` | Texto principal |
| `--primary` | `245 100% 55%` | Azul elétrico (botões, destaques) |
| `--secondary` | `130 100% 45%` | Verde neon (badges, sucesso) |
| `--card` | `236 80% 10%` | Fundo de cards |
| `--border` | `240 70% 30%` | Bordas |

### Paleta — Snow Blue (light)
| Token | HSL | Uso |
|---|---|---|
| `--background` | `205 60% 97%` | Fundo |
| `--foreground` | `220 30% 15%` | Texto |
| `--primary` | `200 90% 36%` | Azul clássico |
| `--secondary` | `200 85% 50%` | Ciano luminoso |
| `--card` | `0 0% 100%` | Cards brancos |
| `--border` | `210 25% 87%` | Bordas suaves |

### Tipografia
- Fonte: `Sora` (Google Fonts)
- Base: `13.5px` | Ultrawide (≥1536px): `15px` | Mobile (<480px): `13px`

### Classes Utilitárias
- `.bg-gradient-card` — glassmorphism com backdrop-blur
- `.bg-gradient-hero` — gradiente hero para avatares/banners
- `.text-gradient` — texto com gradiente primary → secondary
- `.hover-lift` — elevação com translateY(-4px) + shadow-glow
- `.fade-in-up` — animação de entrada
- `.stagger-children` — animação em cascata para filhos
- `.watermark-bg` — marca d'água TOTVS (opacidade 0.025, rotação 15deg)

## Responsividade

- Mobile first. Sempre testar em 375px, 428px, 768px, 1280px.
- Sidebar colapsa para menu hamburguer em `< md (768px)`.
- Grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-[...]`
- Header mobile: `h-14` | Desktop: `h-16`
- Padding de páginas: `px-3 sm:px-4 md:px-8`, `py-5 md:py-8`

## Backend — Limites e Configuração

- Body size máximo: `8mb` (configurado em `main.ts` via `express.json`)
- CORS: `origin: '*'` (ajustar para domínios específicos em produção)
- Swagger: `GET /api/docs`
- Porta padrão: `3000` (sobrescrita por `process.env.PORT`)

## Variáveis de Ambiente

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/universidade_suri
JWT_SECRET=seu_segredo_aqui
PORT=3000
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:3000
```

## Padrões de Código

- Imports de ícones: sempre de `lucide-react`
- Estado de loading nos componentes: `useState(true)` → `finally { setLoading(false) }`
- Erros de API: capturar em `catch` e exibir com `toast.error(...)`
- Nunca usar `console.log` em produção — usar `toast` para feedback ao usuário
- Componentes de UI base: pasta `frontend/src/components/ui/` (Radix UI / Shadcn)
- `apiRequest` de `@/lib/api` já inclui o JWT no header Authorization automaticamente
