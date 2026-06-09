# Universidade Suri

Plataforma EAD corporativa (padrão TOTVS) com gamificação, comunidade social e certificação digital.  
Monorepo: **backend NestJS** (Clean Architecture + Prisma + MongoDB) e **frontend React** (Vite + Tailwind CSS + shadcn/ui).

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS 4, shadcn/ui, React Router 6 |
| Backend | NestJS 10, Prisma ORM 5, MongoDB, JWT (Passport.js) |
| Infra | Docker Compose (dev), Docker multi-stage (prod), GitHub Actions CI |
| API Docs | Swagger (`/api/docs`) |

---

## Início Rápido

### Pré-requisitos
- Node.js 20+
- Docker + Docker Compose

### 1. Banco de dados
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed          # cria admin: admin@suri.com / SuriAdmin123
npm run start:dev        # http://localhost:3000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev              # http://localhost:5173
```

---

## Estrutura

```
universidade-suri/
├── backend/
│   ├── src/
│   │   ├── domain/           # Entidades e interfaces de repositório
│   │   └── infrastructure/   # Controllers, Prisma repos, JWT strategy
│   ├── prisma/schema.prisma  # Modelo de dados
│   └── scripts/              # Utilitários de banco (migrate, seed, backup)
├── frontend/
│   └── src/
│       ├── pages/            # Uma página por rota
│       ├── components/ui/    # Componentes shadcn/ui (16 ativos)
│       ├── lib/              # api.ts, auth.tsx, theme.tsx, utils.ts
│       └── styles.css        # Tokens de tema (Night Blue / Snow Blue)
├── docs/                     # Documentação técnica e ADRs
├── skills/rules/             # Regras de negócio e design system (fonte primária)
├── CLAUDE.md                 # Guia de desenvolvimento para Claude Code
└── CONTRIBUTING.md           # Workflow de PR e padrões de código
```

---

## Perfis de Usuário

| Grupo | Tiers | Acesso |
|---|---|---|
| `embaixador` | Voice / Elite / Icon | Feed de Embaixadores, cursos do grupo |
| `vip` | Blue / Core / Plus | Feed de VIPs, cursos do grupo |
| `admin` | — | Painel administrativo, visão total |

---

## Documentação

- [Arquitetura](docs/architecture.md) — diagramas, Clean Architecture, rotas
- [Deploy em Produção](docs/deploy-guide.md) — Docker, SSL, migrações
- [Segurança](docs/security.md) — JWT, CORS, bcrypt
- [ADRs](docs/adr/) — decisões técnicas registradas
- [Regras de Negócio](skills/rules/business-rules.md) — gamificação, certificação, feed
- [Design System](skills/rules/design-system.md) — paleta HSL, tipografia, classes utilitárias
- [CLAUDE.md](CLAUDE.md) — guia completo de desenvolvimento (para Claude Code)
- [CONTRIBUTING.md](CONTRIBUTING.md) — workflow de contribuição
