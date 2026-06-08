# Arquitetura do Backend

## Estrutura de Pastas

```
backend/
├── prisma/
│   └── schema.prisma          # fonte da verdade — 24 models
├── data/changelog/            # JSON por versão (GET /changelog)
├── scripts/                   # utilitários ts-node: migrate, seed, backup, restore, sync
└── src/
    ├── <feature>/             # FEATURE MODULES — uma pasta por domínio (estilo NestJS)
    │   ├── <feature>.module.ts      # registra controller + service (+ provider de repo)
    │   ├── <feature>.controller.ts  # REST controller fino — só delega ao service
    │   └── <feature>.service.ts     # lógica de negócio + autorização
    │   # ex.: auth/, courses/, enrollments/, certificates/, posts/, trails/,
    │   #      quiz/, roadmaps/, settings/, gamification/, instructors/,
    │   #      external/, changelog/, admin/ (groups + reports + api-tokens)
    ├── domain/
    │   ├── entities/          # User, Course, Certificate, Post, Roadmap
    │   │                      # regras de domínio puras (ex.: User.addXp, User.updateTier)
    │   └── repositories/      # interfaces: I*Repository (ex.: IUserRepository)
    ├── infrastructure/
    │   ├── database/
    │   │   ├── prisma.service.ts     # PrismaClient singleton
    │   │   ├── prisma.module.ts      # @Global() — exporta PrismaService
    │   │   └── repositories/        # prisma-*.repository.ts — implementações concretas
    │   ├── http/
    │   │   ├── dtos/                # class-validator DTOs (auth.dto, api-token.dto)
    │   │   ├── guards/              # ApiTokenGuard
    │   │   └── strategies/          # jwt.strategy.ts, api-token.strategy.ts
    │   └── storage/                 # storage.module.ts (@Global) + supabase-storage.service.ts
    ├── main.ts                # bootstrap NestJS
    └── app.module.ts          # AppModule — importa infra global + feature modules
```

---

## AppModule — Módulo Raiz

`AppModule` é enxuto: importa os módulos de infraestrutura globais (`PrismaModule`,
`StorageModule`, `PassportModule`, `ThrottlerModule`) e **todos os feature modules**.
Cada domínio é um **feature module** no estilo `courses/` — com controller fino, service
(lógica de negócio) e, quando há CRUD claro, provider de repositório
(`{ provide: I*Repository, useClass: Prisma*Repository }`). `JwtModule` e o `JwtStrategy`
vivem no `AuthModule`; o `ApiTokenStrategy` vive no `ExternalApiModule`.

> Ao criar um novo domínio: criar a pasta `src/<feature>/` com `*.module.ts`,
> `*.controller.ts` e `*.service.ts`, e importar o módulo no `AppModule`.
> Controllers **não** acessam Prisma diretamente — toda lógica fica no service.

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
1. Criar a interface + Symbol em `domain/repositories/<novo>.repository.interface.ts`
2. Criar a implementação em `infrastructure/database/repositories/prisma-<novo>.repository.ts`
3. Registrar o par `{ provide, useClass }` no array `providers` do **feature module** correspondente
   (ex.: `CoursesModule`), e injetar no service via `@Inject(I<Novo>Repository)`

> Features de agregação/leitura (admin-reports, external-api) ou config (settings,
> gamification) podem usar `PrismaService` diretamente dentro do service, sem repositório
> dedicado — abordagem pragmática quando não há um agregado CRUD claro.

---

## Controllers e Rotas

Cada controller delega ao service do seu feature module (mesmo prefixo de rota de antes).

| Feature Module | Controller | Prefixo de Rota | Responsabilidade |
|----------------|-----------|----------------|------------------|
| `AuthModule` | `AuthController` | `auth` | Login, signup, perfil, reset de senha, leaderboard, usuários (admin) |
| `CoursesModule` | `CoursesController` | `courses` | Listagem, detalhe e CRUD de cursos + aulas |
| `EnrollmentsModule` | `EnrollmentsController` | `enrollments` | Matrículas e progresso de aulas |
| `CertificatesModule` | `CertificatesController` | `certificates` | Geração, emissão manual e validação |
| `QuizModule` | `QuizController` | `quiz` | Questões, tentativas, tentativas extras (admin) |
| `TrailsModule` | `TrailsController` | `trails` | Trilhas, inscrição, exame final |
| `PostsModule` | `PostsController` | `posts` | Feed da comunidade, curtidas, comentários |
| `RoadmapsModule` | `RoadmapsController` | `roadmaps` | Conteúdo curado (CRUD admin + leitura) |
| `SettingsModule` | `SettingsController` | `settings` | Configurações globais (logos, visibilidade de fotos) |
| `ChangelogModule` | `ChangelogController` | `changelog` | Versões da plataforma (JSON files) |
| `GamificationModule` | `GamificationController` | `gamification`, `admin/gamification` | XpRules ativas + GroupRules + edição (admin) |
| `InstructorsModule` | `InstructorsController` | `instructors`, `admin/instructors`, `courses/:id/instructors` | CRUD de instrutores + associação a cursos |
| `AdminModule` | `AdminGroupsController` | `admin/groups` | CRUD de GroupRules e distribuição de usuários |
| `AdminModule` | `AdminReportsController` | `admin/reports` | Relatórios administrativos |
| `AdminModule` | `AdminApiTokenController` | `admin/api-tokens` | CRUD de tokens de API externa |
| `ExternalApiModule` | `ExternalApiController` | `external` | endpoints GET para sistemas externos (ApiTokenGuard) |

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
