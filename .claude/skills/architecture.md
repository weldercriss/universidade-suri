# 🏗️ Arquitetura & Organização do Projeto

A **Universidade Suri** é um monorepo com `/frontend` (SPA) e `/backend` (API), desacoplados.

## Stack

- **Frontend**: React 19 + Vite 7 + TypeScript + Tailwind CSS v4 + shadcn/ui (Radix).
- **Backend**: NestJS 10 + Prisma 5 + PostgreSQL 16. Clean-ish architecture (ver abaixo).
- **Auth**: JWT (Passport.js) + bcrypt para usuários; token SHA256 (`suri_<hex>`) para sistemas
  externos. **Sem Google OAuth/SSO.**
- **Segurança**: helmet, `@nestjs/throttler`, class-validator.
- **Docker**: PostgreSQL (5435), Backend (3000), Frontend (80). Dev: Vite em 5173.

---

## 🎨 1. Frontend (`frontend/`)

SPA pura. Estado de auth/tema/settings via Context Providers.

```
frontend/
├── public/                  # manifest.json, totvs.svg, logos
├── src/
│   ├── components/
│   │   ├── ui/              # base shadcn/Radix (Button, Card, Input, sonner…)
│   │   └── app-shell.tsx    # layout + sidebar retrátil
│   ├── hooks/               # ex.: useCachedRequest
│   ├── lib/
│   │   ├── api.ts           # apiRequest — injeta JWT no Authorization automaticamente
│   │   ├── auth.tsx         # AuthProvider (login/signup/usuário)
│   │   ├── theme.tsx        # tema Snow Blue / Night Blue
│   │   ├── settings.tsx     # SettingsProvider (polling 60s de /settings/public)
│   │   └── utils.ts
│   ├── pages/               # Dashboard, AdminPanel, AdminCourses, AdminTrails,
│   │                        # AdminGroups, AdminReports, AdminRoadmap, AdminQuizzes,
│   │                        # CoursesList, CoursePlayer, TrailsList, Roadmap, Community,
│   │                        # Leaderboard, Profile, Settings, Login, SignUp, Certificate, Landing
│   ├── styles.css           # tokens de tema (Tailwind v4) — fonte da verdade do design
│   ├── App.tsx / main.tsx
│   └── sw.js / registerServiceWorker.ts   # PWA
├── index.html               # inicializa também o webchat CBM
└── vite.config.ts
```

### Padrões de Código (frontend)
- Ícones: **exclusivamente `lucide-react`**.
- Loading: `useState(true)` → `finally { setLoading(false) }`.
- Erros de API: `catch` + `toast.error(...)`. **Nunca `console.log` em produção** — usar `toast`.
- `apiRequest` de `@/lib/api` já inclui o JWT no header.
- Cache: `useCachedRequest<T>(url, ttlSeconds)` (Map global, `clearApiCache()` no logout).
  TTLs sugeridos: cursos/leaderboard 120s, roadmap 30s, progress 60s.

---

## 🛡️ 2. Backend (`backend/`)

NestJS organizado por camadas. **Existe um único `AppModule`** — sem feature modules;
controllers, providers e repositórios são registrados centralmente em `src/app.module.ts`.

```
backend/
├── prisma/schema.prisma     # 23 models (fonte da verdade do banco)
├── data/changelog/          # JSON por versão (GET /changelog)
├── src/
│   ├── domain/
│   │   ├── entities/        # User, Course, Certificate, Post, Roadmap (regras puras, ex.: addXp)
│   │   └── repositories/    # interfaces: *.repository.interface.ts
│   ├── application/         # camada de casos de uso (atualmente mínima — lógica vive nos controllers)
│   ├── infrastructure/
│   │   ├── database/        # PrismaService + repositórios concretos (prisma-*.repository.ts)
│   │   ├── http/
│   │   │   ├── controllers/ # REST (lista abaixo)
│   │   │   ├── dtos/        # auth.dto.ts, api-token.dto.ts (class-validator)
│   │   │   ├── guards/      # ApiTokenGuard
│   │   │   └── strategies/  # jwt.strategy.ts, api-token.strategy.ts (Passport)
│   │   └── config/
│   ├── main.ts              # bootstrap: helmet, CORS, ValidationPipe, body 8mb, Swagger /api-docs
│   └── app.module.ts        # módulo raiz (DI central)
└── scripts/                 # utilitários ts-node (ver §3)
```

> **Onde mora a lógica de negócio**: principalmente nos **controllers** + **repositórios Prisma**.
> A pasta `application/` é reservada para casos de uso mas hoje é mínima — não assuma um fluxo
> use-case completo ao mexer no backend; siga o padrão controller→repository existente.

### Padrão de Repositório
Injetados por **token de interface** (não classe):
```typescript
{ provide: IUserRepository, useClass: PrismaUserRepository }
```
Interfaces em `domain/repositories/`, implementações em `infrastructure/database/repositories/`.

### Controllers (prefixos de rota)
`auth`, `courses`, `enrollments`, `certificates`, `quiz`, `trails`, `posts`, `roadmaps`,
`settings`, `changelog`, `admin/groups`, `admin/reports`, `admin/api-tokens`, `external`.

---

## 🛠️ 3. Scripts & Comandos

### Backend (`cd backend`)
```bash
npm run start:dev    # hot reload (porta 3000)
npm run build        # nest build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint --fix
npm run test         # jest (unit)
npm run test:integration / test:e2e / test:coverage
npm run db:migrate   # ts-node scripts/migrate.ts (SQL transacional)
npm run db:sync      # detecta colunas/chaves ausentes
npm run db:backup    # pg_dump → backend/backups/
npm run db:restore   # restaura último dump via psql
npm run db:seed      # cria admin: admin@suri.com / SuriAdmin123
```

### Frontend (`cd frontend`)
```bash
npm run dev          # Vite (porta 5173)
npm run build        # build de produção
```

---

## 🔐 4. Segurança (resumo)

- **CORS** via `ALLOWED_ORIGINS` (sem wildcard em produção).
- **Helmet** com CSP; `crossOriginEmbedderPolicy: false` (iframes YouTube).
- **Rate limit**: 100 req/min global; 10 req/min em `/auth/login` e `/auth/signup`.
- **Body size**: 8mb. SQL injection mitigado por queries parametrizadas do Prisma.
- Detalhes do modelo de segurança: `docs/security.md`.

---

## 🔗 Relacionado

- Design/tema: `design-system.md`. Banco: `database.md`. Regras: `business-rules.md`.
- Quizzes/trilhas: `quizzes-trilhas.md`. API externa: `api-externa.md`.
