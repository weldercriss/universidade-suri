# CLAUDE.md — Universidade Suri

Guia unificado para o assistente de IA. Descreve stack, arquitetura, regras de negócio e padrões de código.

> Documentação detalhada nos arquivos de skills: `skills/design-system.md`, `skills/architecture.md`, `skills/business-rules.md`, `skills/user-groups.md`, `skills/database.md`, `skills/quizzes-trilhas.md`, `skills/api-externa.md`, `skills/gamificacao-certificados.md`

---

## Stack

- **Backend**: NestJS 10 + Prisma ORM + PostgreSQL 16
- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Auth usuários**: JWT (Passport.js), bcrypt — token em `localStorage["suri_token"]`, usuário em `localStorage["nimbus_user"]`
- **Auth sistemas externos**: Token SHA256 (passport-custom), modelo `ApiToken`, formato `suri_<64hex>`
- **Webchat**: ChatbotMaker (CBM) via `webchat.chatbotmaker.io/cbm-jssdk.js`
- **Segurança**: helmet, @nestjs/throttler, class-validator
- **Docker**: PostgreSQL (5435), Backend (3000), Frontend (80)

---

## Estrutura do Projeto

```
universidade-suri/
├── frontend/          # SPA React + Vite + Tailwind CSS
├── backend/           # API NestJS (Clean Architecture) + Prisma ORM
│   └── data/changelog/  # Arquivos JSON de versões/releases da plataforma
├── .claude/           # Guias para o assistente de IA
│   ├── CLAUDE.md      # Este arquivo (fonte principal)
│   └── skills/        # Documentação detalhada por domínio
└── docker-compose.yml
```

---

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

---

## Arquitetura e Módulos

O backend usa um único `AppModule` — sem feature modules. Controllers, providers e repositórios são registrados centralmente em `backend/src/app.module.ts`.

### Padrão de Repositório
Repositórios são injetados via token (não classe):
```typescript
{ provide: IUserRepository, useClass: PrismaUserRepository }
```
Interfaces em `domain/repositories/`, implementações em `infrastructure/database/repositories/`.

---

## Autenticação

### Usuários da plataforma (JWT)
- Rota protegida: `@UseGuards(AuthGuard('jwt'))`
- Rota admin: `if (!req.user.isAdmin) throw new ForbiddenException(...)`
- **Apenas e-mail + senha corporativo. Sem Google OAuth, sem SSO.**

### Sistemas externos (API Token)
- Tokens criados via `POST /admin/api-tokens` (admin only)
- Persistido como `SHA256(token)` na tabela `ApiToken`; exibido apenas na criação
- Enviado como `Authorization: Bearer suri_<token>` para rotas `/external/*`
- Guard: `@UseGuards(ApiTokenGuard)` em `ExternalApiController`
- Rastreia `lastUsedAt` e valida `isActive` e `expiresAt`

---

## Perfis de Usuário

- `groupType`: `"vip"` | `"embaixador"`
- Tier VIP: `"VIP PLUS"`, `"VIP GOLD"`, `"VIP PLATINUM"`
- Tier Embaixador: `"Embaixador Voice"`, `"Embaixador Elite"`, `"Embaixador Icon"`
- `isAdmin: true` → acesso ao painel admin; sem acesso a cursos/comunidade como aluno
- `company`: empresa do usuário (campo opcional, gerenciado pelo admin)
- `isFirstLogin`: `true` se sem nenhum `ModuleProgress` — controla saudação e "Continue assistindo"
- Admins exibem badge "ADMINISTRADOR" no lugar do tier

---

## Regras de Negócio Críticas

- Admin não acumula XP (`addXp()` retorna early se `isAdmin`)
- Conclusão de aulas é **sequencial** (verifica aula anterior antes de marcar)
- Quiz: máximo 3 tentativas; ≥70% para passar; admins podem conceder tentativas extras
- Exame de trilha: máximo 3 tentativas; ≥70% para passar e liberar certificado de trilha
- Publicação de curso via `isPublished` flag; `targetGroup` filtra por grupo de usuários (`'all'`, `'vip'`, `'embaixador'`)
- Usuários só veem roadmaps com `isActive=true`
- Feed da comunidade segmentado por `groupType` — VIPs veem só VIPs, Embaixadores só Embaixadores
- Admin vê todos os posts mas não pode publicar; cada post = +100 XP ao autor
- Inscrição em curso explícita via `POST /enrollments/:courseId/join`; auto-enroll no CoursePlayer como fallback
- Token de API: exibido apenas na criação; hash SHA256 armazenado; `isActive` e `expiresAt` validados a cada request

---

## Certificados

- Código de curso: `UNISURI-[6 chars HEX]` (automático) ou `UNISURI-MAN-[HEX]` (manual pelo admin)
- Código de trilha: `SURI-TR-[6 chars HEX]` (automático ao passar no exame final da trilha)
- Validação pública: `GET /certificates/validate/:code`
- Exportação PDF: `html2canvas` + `jsPDF`; exportação PNG também disponível

---

## Trilhas

- Página `/trilhas` com abas: "Minhas Trilhas" (inscritas) e "Catálogo" (disponíveis)
- Inscrição via `POST /trails/:id/enroll`
- Exame final disponível após 100% de módulos concluídos em todos os cursos da trilha
- Aprovação ≥70%. Máximo 3 tentativas. +200 XP ao passar.
- Endpoints: `GET /trails/:id/exam/status`, `GET /trails/:id/exam/questions`, `POST /trails/:id/exam/submit`

---

## Changelog da Plataforma

- Arquivos JSON em `backend/data/changelog/` — um arquivo por versão (ex: `v1.2.0.json`)
- Formato: `{ version, date, title, changes: [{ type: "new"|"improved"|"fixed", text }] }`
- Endpoint: `GET /changelog` (sem autenticação)
- Frontend: modal acessível via badge de versão na sidebar; badge "Novo" quando há versões não vistas
- Última versão vista rastreada em `localStorage["suri_changelog_seen"]`

---

## Webchat (Balão de Suporte)

- Widget CBM inicializado em `index.html` via `window.cbAsyncInit`; `CBM.ChatbotId = "cb11077427"`
- Desktop: botão flutuante com opacidade 0.45 → 1.0 no hover
- Mobile: acionado pelo ícone `MessageCircle` no header; `document.querySelector('.__talkjs_launcher')?.click()`

---

## API Externa (`/external/*`)

15 endpoints GET para integração com sistemas externos. Ver tabela completa em `docs/project-architecture.md`.
Guard: `@UseGuards(ApiTokenGuard)`.

---

## Configurações Globais (SystemSetting)

| Chave | Tipo | Descrição |
|-------|------|-----------|
| `logo_expanded_light` | string (path) | Logo expandido tema claro |
| `logo_expanded_dark` | string (path) | Logo expandido tema escuro |
| `logo_collapsed_light` | string (path) | Logo colapsado tema claro |
| `logo_collapsed_dark` | string (path) | Logo colapsado tema escuro |
| `show_user_photos` | `"true"` \| `"false"` | Exibição de fotos de outros usuários |

Acessadas via `GET /settings/public` (sem auth). `SettingsProvider` faz polling de 60s.

---

## Cache de Consultas

`useCachedRequest<T>(url, ttlSeconds)` em `frontend/src/hooks/useCachedRequest.ts`:
- Cache de nível de módulo (Map global, persiste entre navegação)
- `clearApiCache()` chamado no logout
- TTLs recomendados: cursos/leaderboard 120s, roadmap 30s, progress 60s

---

## DTOs e Validação

- `backend/src/infrastructure/http/dtos/auth.dto.ts` — `LoginDto`, `SignupDto`, `UpdateProfileDto`, `PhotoVisibilityDto`
- `backend/src/infrastructure/http/dtos/api-token.dto.ts` — `CreateApiTokenDto`
- `ValidationPipe({ whitelist: true, transform: true })` global

---

## Segurança

- **CORS**: usa `ALLOWED_ORIGINS` env var (sem wildcard em produção)
- **Helmet**: CSP configurada; `crossOriginEmbedderPolicy: false` (YouTube iframes)
- **Rate limit**: 100 req/min global; 10 req/min em `/auth/login` e `/auth/signup`
- **SQL Injection**: Prisma parameterized queries
- **Body size**: 8mb máximo (configurado em `main.ts`)

---

## Variáveis de Ambiente

### Backend (`backend/.env`)
```env
DATABASE_URL=          # URL com pooler
DIRECT_URL=            # URL direta (migrações Prisma)
JWT_SECRET=            # Mínimo 32 caracteres
ALLOWED_ORIGINS=       # Vírgula separado: http://localhost:5173,...
FRONTEND_URL=          # Para links de reset de senha
BCRYPT_ROUNDS=12
PORT=3000
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3000
```

---

## Design System (resumo — detalhes em `skills/design-system.md`)

- Paleta **Suri Blue** — fonte da verdade é `frontend/src/styles.css`
- Tema escuro (Night Blue / `.dark`): `--background: 222 22% 8%`, `--primary: 237 90% 65%`, `--secondary: 237 90% 68%`
- Tema claro (Snow Blue / `:root`): `--background: 218 42% 91%`, `--primary: 234 85% 45%`, `--secondary: 237 90% 63%`
- Fonte: `Sora` (Google Fonts), base `14px`, ultrawide `15px`
- Ícones: exclusivamente `lucide-react`
- Classes: `.bg-gradient-card` (glassmorphism), `.text-gradient`, `.hover-lift`, `.watermark-bg`
- Mobile first; testar em 375px, 428px, 768px, 1280px

---

## Padrões de Código

- Imports de ícones: sempre de `lucide-react`
- Loading: `useState(true)` → `finally { setLoading(false) }`
- Erros de API: `catch` + `toast.error(...)`
- Nunca usar `console.log` em produção — usar `toast` para feedback
- Componentes UI base: `frontend/src/components/ui/` (Radix UI / shadcn)
- `apiRequest` de `@/lib/api` já inclui o JWT no header Authorization automaticamente

---

## Documentação Detalhada

- `docs/project-architecture.md` — endpoints completos, modelos, componentes e fluxos
- `docs/architecture.md` — diagramas de arquitetura
- `docs/security.md` — modelo de segurança detalhado
- `skills/design-system.md` — design system completo
- `skills/architecture.md` — estrutura de pastas detalhada
- `skills/business-rules.md` — regras de negócio completas
- `skills/user-groups.md` — grupos, tiers e GroupRules
- `skills/database.md` — ERD e schema completo (Prisma, 23 models)
- `skills/quizzes-trilhas.md` — quizzes de curso, trilhas e exame final
- `skills/api-externa.md` — tokens de API e endpoints `/external/*`
- `skills/gamificacao-certificados.md` — XP, níveis, leaderboard e certificados
