# CLAUDE.md — Backend (Universidade Suri)

Guia específico do backend NestJS. Para o frontend, ver `frontend/.claude/CLAUDE.md`.

> Skills detalhadas em `skills/`: `architecture.md`, `database.md`, `business-rules.md`, `auth-seguranca.md`, `api-externa.md`, `quizzes-trilhas.md`, `gamificacao-certificados.md`

---

## Stack

- **Framework**: NestJS 10
- **ORM**: Prisma 5 + PostgreSQL 16
- **Auth usuários**: JWT (Passport.js + passport-jwt), bcrypt
- **Auth sistemas externos**: Token SHA256 (passport-custom), modelo `ApiToken`, formato `suri_<64hex>`
- **Segurança**: helmet, @nestjs/throttler, class-validator, CORS
- **Documentação**: Swagger em `/api-docs`
- **Portas**: Backend (3000), PostgreSQL Docker (5435)

---

## Comandos

```bash
npm run start:dev      # hot reload (porta 3000)
npm run build          # nest build
npm run typecheck      # tsc --noEmit
npm run lint           # eslint --fix
npm run test           # jest (unit)
npm run test:integration
npm run test:e2e
npm run test:coverage
npm run db:migrate     # roda migrações SQL via ts-node
npm run db:sync        # detecta colunas/chaves ausentes
npm run db:backup      # pg_dump → backend/backups/
npm run db:restore     # restaura último dump via psql
npm run db:seed        # cria admin: admin@suri.com / SuriAdmin123
```

---

## Arquitetura

**Feature modules** — cada domínio em sua pasta `src/<feature>/` (estilo NestJS), com
`*.module.ts`, `*.controller.ts` e `*.service.ts`. O `AppModule` importa os módulos de
infraestrutura globais (`PrismaModule`, `StorageModule`, `PassportModule`, `ThrottlerModule`)
e todos os feature modules. **Controllers são finos e delegam ao service; toda a lógica de
negócio + autorização vive no service. Nunca acessar Prisma direto no controller.**

Módulos: `auth/`, `courses/`, `enrollments/`, `certificates/`, `posts/`, `trails/`, `quiz/`,
`roadmaps/`, `settings/`, `gamification/`, `instructors/`, `external/`, `changelog/` e
`admin/` (agrega groups + reports + api-tokens).

### Padrão de Repositório
Injetados por token de interface (não classe), **registrado no feature module**:
```typescript
// <feature>.module.ts → providers
{ provide: IUserRepository, useClass: PrismaUserRepository }
// service → constructor
@Inject(ICourseRepository) private readonly courseRepository: ICourseRepository
```
- Interfaces + Symbol: `domain/repositories/*.repository.interface.ts`
- Implementações: `infrastructure/database/repositories/prisma-*.repository.ts`
- Camada de repositório onde há **CRUD claro** (courses, posts, roadmaps, instructors, users).
  Features de agregação/leitura/config (enrollments, certificates, quiz, trails, settings,
  gamification, admin, external) usam `PrismaService` direto **dentro do service**.

### Controllers (prefixos de rota — inalterados pela refatoração)
`auth`, `courses`, `enrollments`, `certificates`, `quiz`, `trails`, `posts`, `roadmaps`,
`settings`, `changelog`, `gamification`, `instructors`, `admin/groups`, `admin/reports`,
`admin/api-tokens`, `admin/gamification`, `external`

### Onde vive a lógica de negócio
Nos **services** de cada feature module (`src/<feature>/<feature>.service.ts`), que orquestram
repositórios e/ou `PrismaService`. Ao adicionar funcionalidade: estender o service do domínio
(ou criar um novo feature module no estilo `courses/`).

---

## Autenticação

### Usuários da plataforma (JWT)
- Rota protegida: `@UseGuards(AuthGuard('jwt'))`
- Rota admin: `if (!req.user.isAdmin) throw new ForbiddenException(...)`
- **Apenas e-mail + senha corporativo. Sem Google OAuth, sem SSO.**

### Sistemas externos (API Token)
- Tokens criados via `POST /admin/api-tokens` (admin only)
- Persistido como `SHA256(token)`; exibido apenas na criação
- Enviado como `Authorization: Bearer suri_<token>` para rotas `/external/*`
- Guard: `@UseGuards(ApiTokenGuard)` em `ExternalApiController`
- Rastreia `lastUsedAt` e valida `isActive` e `expiresAt` a cada request

---

## Regras de Negócio Críticas

- Admin não acumula XP — `addXp()` retorna early se `isAdmin`
- Conclusão de aulas é **sequencial** — verifica aula anterior em `module_progress`
- Quiz: máximo 3 tentativas; ≥70% para passar; admins podem conceder extras (`QuizExtraAttempt`)
- Exame de trilha: máximo 3 tentativas; ≥70% para passar e emitir certificado de trilha
- `targetGroup` (`'all'`, `'vip'`, `'embaixador'`) filtra catálogo e valida acesso no backend (`403` se incompatível)
- Feed da comunidade segmentado por `groupType` — VIPs só veem VIPs, Embaixadores só Embaixadores
- Admin vê todos os posts mas não pode publicar
- Token de API: hash SHA256 armazenado; `isActive` e `expiresAt` validados a cada request
- XP por ação configurável via `XpRule`; controllers lêem do banco com fallback hardcoded

---

## DTOs e Validação

- `src/infrastructure/http/dtos/auth.dto.ts` — `LoginDto`, `SignupDto`, `UpdateProfileDto`, `PhotoVisibilityDto`
- `src/infrastructure/http/dtos/api-token.dto.ts` — `CreateApiTokenDto`
- `ValidationPipe({ whitelist: true, transform: true })` global em `main.ts`

---

## Segurança

- **CORS**: `ALLOWED_ORIGINS` env var — nunca wildcard em produção
- **Helmet**: CSP configurada; `crossOriginEmbedderPolicy: false` (YouTube iframes)
- **Rate limit**: 100 req/min global; 10 req/min em `/auth/login` e `/auth/signup`
- **SQL Injection**: Prisma parameterized queries
- **Body size**: 8mb máximo (`main.ts`)

---

## Variáveis de Ambiente (`.env`)

```env
DATABASE_URL=          # URL com pooler
DIRECT_URL=            # URL direta (migrações Prisma)
JWT_SECRET=            # Mínimo 32 caracteres
ALLOWED_ORIGINS=       # Ex.: http://localhost:5173,https://suri.com
FRONTEND_URL=          # Para links de reset de senha
BCRYPT_ROUNDS=12
PORT=3000
```

---

## Changelog da Plataforma

- Arquivos JSON em `data/changelog/` — um por versão (ex: `v1.2.0.json`)
- Formato: `{ version, date, title, changes: [{ type: "new"|"improved"|"fixed", text }] }`
- Endpoint: `GET /changelog` (sem autenticação)

---

## Configurações Globais (SystemSetting)

Tabela `system_settings` com pares `key`/`value`.

| Chave | Descrição |
|-------|-----------|
| `logo_expanded_light` | Logo expandido tema claro |
| `logo_expanded_dark` | Logo expandido tema escuro |
| `logo_collapsed_light` | Logo colapsado tema claro |
| `logo_collapsed_dark` | Logo colapsado tema escuro |
| `show_user_photos` | `"true"` \| `"false"` — exibição de fotos de outros usuários |

- `GET /settings/public` — sem auth; `SettingsProvider` do frontend faz polling de 60s
- `POST /settings/logos` — admin
- `PATCH /settings/photo-visibility` — usuário autenticado
