# Arquitetura do Backend

## Estrutura de Pastas

```
backend/
├── prisma/
│   └── schema.prisma          # fonte da verdade — 24 models
├── data/changelog/            # JSON por versão (GET /changelog)
├── scripts/                   # utilitários ts-node: migrate, seed, backup, restore, sync
└── src/
    ├── domain/
    │   ├── entities/          # User, Course, Certificate, Post, Roadmap
    │   │                      # regras de domínio puras (ex.: User.addXp, User.updateTier)
    │   └── repositories/      # interfaces: I*Repository (ex.: IUserRepository)
    ├── application/           # casos de uso — atualmente mínima; lógica principal nos controllers
    ├── infrastructure/
    │   ├── database/
    │   │   ├── prisma.service.ts     # PrismaClient singleton
    │   │   └── repositories/        # prisma-*.repository.ts — implementações concretas
    │   ├── http/
    │   │   ├── controllers/         # REST controllers (um por domínio)
    │   │   ├── dtos/                # class-validator DTOs
    │   │   ├── guards/              # ApiTokenGuard
    │   │   └── strategies/          # jwt.strategy.ts, api-token.strategy.ts
    │   └── config/
    ├── main.ts                # bootstrap NestJS
    └── app.module.ts          # AppModule — DI central (único módulo)
```

---

## AppModule — Módulo Raiz

Todos os controllers, providers e injeções de repositório registrados em um único `AppModule`. Não criar feature modules — seguir o padrão existente.

---

## Padrão de Repositório (injeção por token)

```typescript
// app.module.ts — providers
{
  provide: IUserRepository,
  useClass: PrismaUserRepository,
}
```

Para adicionar um novo repositório:
1. Criar a interface em `domain/repositories/i-novo.repository.interface.ts`
2. Criar a implementação em `infrastructure/database/repositories/prisma-novo.repository.ts`
3. Registrar o par `{ provide, useClass }` no array `providers` do `AppModule`

---

## Controllers e Rotas

| Controller | Prefixo de Rota | Responsabilidade |
|-----------|----------------|------------------|
| `AuthController` | `auth` | Login, signup, perfil, reset de senha, leaderboard |
| `CourseController` | `courses` | Listagem, detalhe e CRUD de cursos |
| `EnrollmentController` | `enrollments` | Matrículas e progresso de aulas |
| `CertificateController` | `certificates` | Geração, emissão manual e validação |
| `QuizController` | `quiz` | Questões, tentativas, tentativas extras (admin) |
| `TrailController` | `trails` | Trilhas, inscrição, exame final |
| `PostController` | `posts` | Feed da comunidade, curtidas, comentários |
| `RoadmapController` | `roadmaps` | Conteúdo curado (CRUD admin + leitura) |
| `SettingsController` | `settings` | Configurações globais (logos, visibilidade de fotos) |
| `ChangelogController` | `changelog` | Versões da plataforma (JSON files) |
| `GamificationController` | `gamification` | XpRules ativas + GroupRules |
| `AdminGroupController` | `admin/groups` | CRUD de GroupRules e distribuição de usuários |
| `AdminReportController` | `admin/reports` | Relatórios administrativos |
| `AdminApiTokenController` | `admin/api-tokens` | CRUD de tokens de API externa |
| `AdminGamificationController` | `admin/gamification` | Edição de XpRules |
| `ExternalApiController` | `external` | 15 endpoints GET para sistemas externos |

---

## Entidades de Domínio

Localizadas em `domain/entities/` — sem dependência de framework (regras puras):

| Entidade | Arquivo | Regras de Domínio |
|----------|---------|-------------------|
| `User` | `user.entity.ts` | `addXp(amount)` — retorna early se `isAdmin`; `level = floor(xp/1000)+1` |
| `Course` | `course.entity.ts` | Validação de publicação e targetGroup |
| `Certificate` | `certificate.entity.ts` | Geração de `verificationCode` |
| `Post` | `post.entity.ts` | Regras de publicação |
| `Roadmap` | `roadmap.entity.ts` | Filtragem por `isActive` |

---

## Estratégias de Autenticação (Passport)

- **`jwt.strategy.ts`** — extrai Bearer do header, verifica com `JWT_SECRET`, popula `req.user`
- **`api-token.strategy.ts`** — extrai Bearer `suri_<hex>`, calcula SHA256, busca e valida `ApiToken` no banco

---

## Guards

- **`AuthGuard('jwt')`** — guard padrão do Passport para rotas protegidas por JWT
- **`ApiTokenGuard`** — aplicado no `ExternalApiController`; usa `api-token.strategy.ts`

---

## Bootstrap (`main.ts`)

```typescript
app.use(helmet({ crossOriginEmbedderPolicy: false })); // CSP + headers de segurança
app.enableCors({ origin: process.env.ALLOWED_ORIGINS?.split(',') });
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
app.use(json({ limit: '8mb' }));
// Swagger disponível em /api-docs
SwaggerModule.setup('api-docs', app, document);
await app.listen(process.env.PORT ?? 3000);
```

---

## Scripts Utilitários (`scripts/`)

| Script npm | Arquivo | Função |
|-----------|---------|--------|
| `db:migrate` | `scripts/migrate.ts` | Executa SQL de migração em transação |
| `db:sync` | `scripts/sync.ts` | Detecta colunas/chaves ausentes no banco |
| `db:backup` | `scripts/backup.ts` | `pg_dump` → `backend/backups/` |
| `db:restore` | `scripts/restore.ts` | Restaura o último dump via `psql` |
| `db:seed` | `scripts/seed.ts` | Cria admin padrão (`admin@suri.com / SuriAdmin123`) |
