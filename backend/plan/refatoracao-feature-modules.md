# Refatoração — Separação de Responsabilidades por Feature Module (Backend)

Replicar o padrão já aplicado em `src/courses/` (controller → service → module → repository)
para **todos os domínios**, isolando cada um em `src/<feature>/`. Decisão: abordagem
**pragmática** — todo domínio ganha module + service + controller fino; camada de repositório
(interface + prisma repo) só onde há CRUD claro; features de agregação/leitura/config usam
`PrismaService` direto dentro do service. API pública inalterada (rotas, payloads, guards).

## Feature modules criados (`src/<feature>/`)

- [x] **auth/** — `AuthService` reutiliza `IUserRepository`; importa `JwtModule`; registra `JwtStrategy`
- [x] **courses/** — já existia (referência do padrão)
- [x] **enrollments/** — service + module (Prisma direto)
- [x] **certificates/** — service + module (usa `ICourseRepository` + Prisma)
- [x] **posts/** — service + module (reutiliza `IPostRepository`)
- [x] **trails/** — service + module (Prisma direto)
- [x] **quiz/** — service + module (usa `ICourseRepository` + Prisma)
- [x] **roadmaps/** — service + module (reutiliza `IRoadmapRepository`)
- [x] **settings/** — service + module (Prisma + StorageService)
- [x] **gamification/** — service + module + `gamification.dto.ts` (Prisma)
- [x] **instructors/** — entity-less repo novo: `IInstructorRepository` + `PrismaInstructorRepository`
- [x] **external/** — service + module; registra `ApiTokenStrategy`; mantém `ApiTokenGuard`
- [x] **changelog/** — service + module (filesystem)
- [x] **admin/** — `AdminModule` único agrega groups + reports + api-tokens (controller+service cada)

## AppModule
- [x] Importa infra global (`PrismaModule`, `StorageModule`, `PassportModule`, `ThrottlerModule`) + todos os feature modules
- [x] Removidos imports de controllers e providers de repositório (movidos para os módulos)
- [x] `JwtModule` movido para `AuthModule`
- [x] Controllers antigos em `infrastructure/http/controllers/` removidos

## Repositório novo
- [x] `domain/repositories/instructor.repository.interface.ts` (interface + Symbol)
- [x] `infrastructure/database/repositories/prisma-instructor.repository.ts`

## Testes
- [x] Specs migrados de controller → service em `test/services/` (auth, courses, posts, certificates, enrollments, trails)
- [x] Corrigido spec órfão de courses (importava `course.controller.ts` deletado)
- [x] `test/helpers/mocks.ts` estendido (`buildInstructorRepoMock`, `buildStorageMock`, `listByCourse`, `xpRule`, `courseInstructor`, etc.)
- [x] Specs novos: `instructors.service.spec.ts`, `gamification.service.spec.ts`
- [x] `npm test` verde (10 suites, 149 testes)

## Docs
- [x] `.claude/skills/architecture.md` — estrutura de pastas, regra de feature modules, tabela de controllers
- [x] `.claude/CLAUDE.md` — arquitetura, repositório, controllers
- [x] `docs/architecture.md` — camadas, repositórios, tabela de feature modules

## Verificação
- [x] `npm run build` (nest build) sem erros
- [x] `npm test` verde
- [ ] Smoke manual: `npm run start:dev` + `/api-docs` (rodar localmente com DB)
