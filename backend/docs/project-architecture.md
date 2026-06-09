# Documentação Técnica — Universidade Suri

> Guia técnico completo para desenvolvedores. Cobre arquitetura, modelos de dados, endpoints, componentes e regras de negócio.

---

## 1. Visão Geral do Projeto

Plataforma EAD com gamificação para grupos corporativos (VIP e Embaixadores). Permite que administradores gerenciem cursos, trilhas de aprendizado, roadmaps, quiz e certificados; e que usuários consumam conteúdo, acumulem XP, subam de nível e publiquem projetos na comunidade.

### Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS 10, Prisma ORM, MongoDB |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v4, shadcn/ui |
| Auth | JWT (Passport.js), bcrypt |
| Containerização | Docker Compose |
| Segurança | helmet, @nestjs/throttler, class-validator |

---

## 2. Estrutura de Pastas

```
universidade-suri/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma           # Definição de todos os modelos do banco
│   ├── src/
│   │   ├── domain/
│   │   │   ├── entities/           # Entidades de domínio (User, Course, etc.)
│   │   │   └── repositories/       # Interfaces de repositório (contratos)
│   │   ├── infrastructure/
│   │   │   ├── database/
│   │   │   │   ├── prisma.service.ts   # Singleton do PrismaClient
│   │   │   │   └── repositories/       # Implementações com Prisma
│   │   │   └── http/
│   │   │       ├── controllers/        # 13 controllers NestJS (rotas REST)
│   │   │       │   ├── auth.controller.ts
│   │   │       │   ├── course.controller.ts
│   │   │       │   ├── enrollment.controller.ts
│   │   │       │   ├── certificate.controller.ts
│   │   │       │   ├── quiz.controller.ts
│   │   │       │   ├── trail.controller.ts
│   │   │       │   ├── post.controller.ts
│   │   │       │   ├── roadmap.controller.ts
│   │   │       │   ├── settings.controller.ts
│   │   │       │   ├── admin-groups.controller.ts
│   │   │       │   ├── admin-reports.controller.ts
│   │   │       │   ├── admin-api-token.controller.ts  ← gerencia tokens externos
│   │   │       │   └── external-api.controller.ts     ← endpoints para sistemas externos
│   │   │       ├── dtos/               # Data Transfer Objects com class-validator
│   │   │       ├── guards/
│   │   │       │   └── api-token.guard.ts  # Guard para rotas /external/*
│   │   │       └── strategies/
│   │   │           ├── jwt.strategy.ts         # Passport JWT (usuários)
│   │   │           └── api-token.strategy.ts   # Passport Custom (sistemas externos)
│   │   ├── app.module.ts           # Módulo raiz: registra todos os controllers, providers, módulos
│   │   └── main.ts                 # Bootstrap: CORS, Helmet, ValidationPipe, Swagger
│   ├── uploads/                    # Arquivos enviados (avatares, logos, capas)
│   ├── .env.example                # Template de variáveis de ambiente
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                 # Componentes shadcn/ui (Button, Card, Switch, etc.)
│   │   │   ├── app-shell.tsx       # Layout raiz: sidebar, header mobile, navegação, botão webchat
│   │   │   ├── UserAvatar.tsx      # Avatar de usuário: foto ou iniciais, controlado por setting
│   │   │   └── QuizModal.tsx       # Modal de quiz de curso
│   │   ├── hooks/
│   │   │   ├── useCachedRequest.ts # Cache de requisições GET com TTL (módulo-level Map)
│   │   │   └── use-mobile.tsx      # Detecta viewport mobile
│   │   ├── lib/
│   │   │   ├── api.ts              # apiRequest() e apiUpload() com token JWT
│   │   │   ├── auth.tsx            # AuthProvider, useAuth, login, logout, signup
│   │   │   ├── settings.tsx        # SettingsProvider, usePlatformSettings, polling 60s
│   │   │   └── theme.tsx           # ThemeProvider, toggle dark/light
│   │   ├── pages/
│   │   │   ├── Landing.tsx         # Página pública de apresentação
│   │   │   ├── Login.tsx           # Formulário de login
│   │   │   ├── SignUp.tsx          # Formulário de cadastro
│   │   │   ├── Dashboard.tsx       # Home autenticada: stats, cursos, ranking
│   │   │   ├── CoursesList.tsx     # Listagem de cursos disponíveis
│   │   │   ├── CoursePlayer.tsx    # Player de aula + quiz + comunidade do curso
│   │   │   ├── Leaderboard.tsx     # Ranking com fotos ou iniciais
│   │   │   ├── Roadmap.tsx         # Roadmaps de aprendizado (polling 30s)
│   │   │   ├── TrailsList.tsx      # Trilhas de aprendizado
│   │   │   ├── Profile.tsx         # Perfil, certificados, histórico de quiz
│   │   │   ├── Settings.tsx        # Configurações pessoais + links admin
│   │   │   ├── Certificate.tsx     # Certificado público por código
│   │   │   ├── AdminPanel.tsx      # Gerenciar usuários + toggle de fotos
│   │   │   ├── AdminCourses.tsx    # CRUD de cursos e aulas
│   │   │   ├── AdminRoadmap.tsx    # CRUD de roadmaps e itens
│   │   │   ├── AdminApiTokens.tsx  # Gerenciar tokens de API externa
│   │   │   └── (outros admin)      # Grupos, Logotipos, Relatórios, Quiz, Newsletter
│   │   ├── types/                  # Interfaces TypeScript compartilhadas (Course, etc.)
│   │   ├── App.tsx                 # Roteamento React Router com guards
│   │   └── styles.css              # Design system, tokens CSS, animações, mobile styles
│   ├── public/
│   │   └── manifest.json           # PWA manifest
│   ├── index.html                  # Inclui inicialização do Webchat ChatbotMaker (CBM)
│   └── vite.config.ts              # Port 5175, alias @, plugin Tailwind, PWA
└── docker-compose.yml              # MongoDB, Backend (3000), Frontend (80)
```

---

## 3. Arquitetura do Backend

Segue **Clean Architecture** simplificada em três camadas:

```
domain/entities/      → Regras de negócio puras (sem Prisma, sem NestJS)
domain/repositories/  → Contratos (interfaces TypeScript)
infrastructure/       → Implementações concretas: Prisma (banco) + controllers (HTTP)
```

### Camada de Domínio

**User entity** ([backend/src/domain/entities/user.entity.ts](../backend/src/domain/entities/user.entity.ts)):
- Valida regras como "admin não acumula XP"
- Método `addXp(amount)`: incrementa XP e calcula nível (1 nível por 1000 XP)
- Campos: `id`, `name`, `email`, `passwordHash`, `groupType`, `tier`, `xp`, `level`, `isAdmin`, `isActive`, `profileImage`, `business`, `phone`, `newsletter`

**Course entity**: gerencia relação `lessons` e flag `isPublished`

### Injeção de Dependência

Os repositórios são injetados via token string (não classe concreta):
```typescript
{ provide: IUserRepository, useClass: PrismaUserRepository }
```
Controllers recebem via `@Inject(IUserRepository)`.

### Módulo Único

Toda a aplicação usa um único `AppModule` com todos os controllers, providers e módulos registrados diretamente. Não há feature modules separados.

### Estratégias de Autenticação

| Estratégia | Arquivo | Uso |
|---|---|---|
| `JwtStrategy` | `strategies/jwt.strategy.ts` | Usuários autenticados (header `Authorization: Bearer <JWT>`) |
| `ApiTokenStrategy` | `strategies/api-token.strategy.ts` | Sistemas externos (header `Authorization: Bearer suri_<token>`) |

A `ApiTokenStrategy` diferencia JWT de token de API verificando se o valor contém 3 pontos (JWT) ou não. O token é comparado via hash SHA256 contra o campo `tokenHash` da tabela `ApiToken`.

---

## 4. Modelos do Banco de Dados (Prisma)

### Profile (Usuário)
```
id, name, email (unique), business, phone?, passwordHash
groupType: "embaixador" | "vip" | "admin"
tier: string (ex: "Embaixador Voice", "VIP PLUS", "ADMIN")
xp, level, isAdmin, isActive, newsletter, profileImage?
resetPasswordToken?, resetPasswordExpiry?
```
Relações: enrollments, certificates, posts, quizAttempts, trailEnrollments

### Course
```
id, title, description?, workloadHours, xpReward, coverUrl?, targetGroup, isPublished
```
`targetGroup`: "all" | "embaixador" | "vip" — filtra quais usuários veem o curso

### Module (Aula)
```
id, courseId, title, description?, content?, videoUrl?, duration, sortOrder
```

### Enrollment → ModuleProgress
Enrollment registra matrícula do usuário no curso. ModuleProgress rastreia conclusão de cada aula (prevenção de fraude: conclusão sequencial obrigatória).

### Certificate / TrailCertificate
Gerado automaticamente ao completar 100% + passar no quiz. Possui `verificationCode` único para validação pública em `/certificado/:codigo`.

### Trail → TrailCourse → TrailEnrollment
Trilha = sequência ordenada de cursos. Exame final com limite de tentativas (padrão 3). Passar no exame (≥70%) libera certificado de trilha.

### Post → PostLike → PostComment
Comunidade de projetos vinculada a cursos. Posts são imutáveis (sem DELETE). Autor não pode curtir o próprio post.

### Roadmap → RoadmapItem
Roadmaps de aprendizado com itens de tipo: `video | document | reference`. Visíveis apenas quando `isActive=true` para usuários não-admin. Polling de 30s no frontend garante atualização sem reload.

### SystemSetting
Armazenamento chave-valor para configurações globais:
| Chave | Valor | Descrição |
|-------|-------|-----------|
| `logo_expanded_light` | `/uploads/logos/...` | Logo expandido tema claro |
| `logo_expanded_dark` | `/uploads/logos/...` | Logo expandido tema escuro |
| `logo_collapsed_light` | `/uploads/logos/...` | Logo colapsado tema claro |
| `logo_collapsed_dark` | `/uploads/logos/...` | Logo colapsado tema escuro |
| `show_user_photos` | `"true"` ou `"false"` | Controla exibição de fotos de outros usuários |

### ApiToken
Tokens de acesso para sistemas externos (sem relação com JWT de usuários):
```
id, name, tokenHash (SHA256, único), isActive, expiresAt?, lastUsedAt?, createdById (FK Profile)
```
- O token em claro (`suri_<64hex>`) é exibido **apenas no momento da criação** e nunca armazenado.
- O hash SHA256 é persistido para validação sem exposição do valor original.
- Gerenciado via `GET/POST/PATCH/DELETE /admin/api-tokens` (admin only).

### GroupRule
Define faixas de XP para classificação automática de tier:
```
groupType, tier, minXp, maxXp?
```
Exemplo: `embaixador / Embaixador Voice / 0 / 1999`

---

## 5. Referência de Endpoints

### Auth (`/auth`)
| Método | Rota | Auth | Throttle | Descrição |
|--------|------|------|----------|-----------|
| POST | `/auth/login` | Não | 10/min | Login email+senha → JWT + dados do usuário |
| POST | `/auth/signup` | Não | 10/min | Cadastro → JWT + dados do usuário |
| GET | `/auth/me` | JWT | - | Perfil completo do usuário autenticado |
| PUT | `/auth/me` | JWT | - | Atualizar nome, imagem, empresa |
| POST | `/auth/me/avatar` | JWT | - | Upload de avatar (multipart, max 5MB) |
| GET | `/auth/users` | JWT+Admin | - | Listar todos os usuários |
| PUT | `/auth/users/:id` | JWT+Admin | - | Editar usuário (nome, grupo, tier, nível) |
| PATCH | `/auth/users/:id/toggle-active` | JWT+Admin | - | Ativar/desativar conta |
| POST | `/auth/forgot-password` | Não | - | Solicitar reset de senha |
| POST | `/auth/reset-password` | Não | - | Redefinir senha com token |
| GET | `/auth/leaderboard` | JWT | - | Top usuários (próprio grupo ou filtrado por admin) |

### Courses (`/courses`)
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/courses/public` | Não | Preview público de cursos |
| GET | `/courses` | JWT | Listagem filtrada por grupo (admin vê todos) |
| GET | `/courses/:id` | JWT | Detalhes + aulas do curso |
| POST | `/courses` | Admin | Criar curso |
| PUT | `/courses/:id` | Admin | Atualizar curso (incluindo isPublished) |
| DELETE | `/courses/:id` | Admin | Excluir curso |
| POST | `/courses/:id/lessons` | Admin | Adicionar aula |
| PUT | `/courses/lessons/:lessonId` | Admin | Editar aula |
| DELETE | `/courses/lessons/:lessonId` | Admin | Excluir aula |
| POST | `/courses/:courseId/cover` | Admin | Upload de capa (multipart) |

### Enrollments (`/enrollments`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/enrollments/progress` | Progresso do usuário em todos os cursos matriculados |
| GET | `/enrollments/courses/:courseId/progress` | Progresso em curso específico |
| POST | `/enrollments/:courseId/join` | Matricular-se em um curso |
| POST | `/enrollments/lessons/:lessonId/complete` | Marcar aula como concluída (sequencial) |

### Certificates (`/certificates`)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/certificates/:courseId/generate` | Gerar certificado (100% + quiz aprovado) |
| POST | `/certificates/:courseId/issue-manual/:userId` | Admin: emitir certificado manual |
| GET | `/certificates/user` | Certificados do usuário (cursos + trilhas) |
| GET | `/certificates/validate/:code` | Validação pública de certificado |

### Quiz (`/quiz`)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/quiz/:courseId/questions` | Admin: criar questão |
| PUT | `/quiz/questions/:questionId` | Admin: editar questão |
| DELETE | `/quiz/questions/:questionId` | Admin: excluir questão |
| GET | `/quiz/:courseId` | Listar questões (sem respostas) |
| POST | `/quiz/:courseId/submit` | Submeter respostas (máx 3 tentativas, ≥70% para passar) |
| GET | `/quiz/:courseId/my-attempts` | Histórico de tentativas do usuário |

### Settings (`/settings`)
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/settings/public` | Não | Configurações públicas (logos + show_user_photos) |
| PATCH | `/settings/photo-visibility` | JWT+Admin | Ativar/desativar fotos de usuários |
| POST | `/settings/logos` | JWT+Admin | Upload de logotipo (multipart) |

### Roadmaps (`/roadmaps`)
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/roadmaps` | JWT | Listar (admin: todos; usuários: apenas ativos) |
| GET | `/roadmaps/:id` | JWT | Detalhes do roadmap |
| POST | `/roadmaps` | Admin | Criar roadmap |
| PUT | `/roadmaps/:id` | Admin | Editar roadmap (incluindo isActive) |
| DELETE | `/roadmaps/:id` | Admin | Excluir roadmap |
| POST | `/roadmaps/:id/items` | Admin | Adicionar item |
| PUT | `/roadmaps/items/:itemId` | Admin | Editar item |
| DELETE | `/roadmaps/items/:itemId` | Admin | Excluir item |

### Trails (`/trails`)
Gerencia trilhas de cursos com exame final e certificado.

### Posts (`/posts`)
Comunidade de projetos por curso.

### Admin Groups (`/admin/groups`)
Gerencia regras de progressão de tier por faixa de XP.

### Admin Reports (`/admin/reports`)
Relatórios analíticos: usuários, matrículas, certificados, taxa de aprovação por curso/grupo.

### Admin API Tokens (`/admin/api-tokens`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/api-tokens` | Listar tokens (sem exibir o valor em claro) |
| POST | `/admin/api-tokens` | Criar token — retorna o valor `suri_<hex>` uma única vez |
| PATCH | `/admin/api-tokens/:id/toggle` | Ativar / desativar token |
| DELETE | `/admin/api-tokens/:id` | Revogar e excluir token |

Todos os endpoints exigem `JWT + isAdmin`. O token criado tem formato `suri_<64 hex chars>`.

### API Externa (`/external`) — Acesso por Token de API

Todos os endpoints abaixo requerem `Authorization: Bearer suri_<token>` (não JWT).

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/external/stats` | Totais: usuários ativos, cursos publicados, trilhas, matrículas, certificados, newsletter |
| GET | `/external/leaderboard` | Top usuários por XP (`?limit=50&groupType=embaixador\|vip`) |
| GET | `/external/users` | Listagem com filtros: `company`, `newsletter`, `groupType`, `tier`, `isActive`, `search` |
| GET | `/external/users/newsletter` | Assinantes da newsletter com email e dados de contato |
| GET | `/external/users/:id` | Detalhes completos + contadores de matrículas e certificados |
| GET | `/external/courses` | Cursos publicados (`?all=true` inclui não-publicados) |
| GET | `/external/courses/:id` | Detalhes com módulos, contagem de matrículas e certificados |
| GET | `/external/trails` | Trilhas com contadores |
| GET | `/external/trails/:id` | Detalhes com cursos da trilha e contadores |
| GET | `/external/enrollments` | Matrículas com filtros (`?userId&courseId&completed=true\|false`, máx 500) |
| GET | `/external/enrollments/user/:userId` | Matrículas de um usuário específico |
| GET | `/external/enrollments/course/:courseId` | Matrículas de um curso específico |
| GET | `/external/certificates` | Certificados de curso e trilha com filtros (máx 500 cada) |
| GET | `/external/certificates/validate/:code` | Valida código público (curso ou trilha) |
| GET | `/external/certificates/user/:userId` | Todos os certificados (cursos + trilhas) de um usuário |

---

## 6. Arquitetura do Frontend

### Contextos Globais

**AuthProvider** (`lib/auth.tsx`):
- Estado: `user: MockUser | null`
- Persiste em `localStorage` (chave `nimbus_user`) e token JWT (chave `suri_token`)
- `fetchProfile()`: busca `/auth/me` e atualiza estado ao montar
- `logout()`: limpa localStorage + chama `clearApiCache()`

**SettingsProvider** (`lib/settings.tsx`):
- Busca `/settings/public` ao montar
- Polling automático de 60 segundos (propaga mudanças do admin sem reload)
- Expõe `settings`, `loading`, `refreshSettings`
- `settings.show_user_photos !== "false"` → controla exibição de fotos de outros usuários

**ThemeProvider** (`lib/theme.tsx`):
- Toggle dark/light, persiste em localStorage

### Hooks Personalizados

**`useCachedRequest<T>(url, ttlSeconds)`** (`hooks/useCachedRequest.ts`):
- Cache de nível de módulo (Map global, survives navigation)
- TTL configurável por endpoint
- `refetch(force=true)` para invalidar e rebuscar
- `clearApiCache()` chamado no logout
- Usado em: Dashboard (120s), Roadmap (30s + polling), Leaderboard no Dashboard (120s)

### Roteamento (App.tsx)

```
/ → Landing (pública)
/login, /signup → Auth (redireciona se autenticado)
/dashboard, /cursos, /ranking, /roadmap, /trilhas, /perfil, /configuracoes → Protegidas (requerem JWT)
/admin, /admin/cursos, /admin/roadmap, etc → Admin (requerem isAdmin)
/certificado/:codigo → Pública
```

### Componente UserAvatar

**`components/UserAvatar.tsx`**: único ponto de renderização de avatar de outros usuários.
- Props: `name`, `profileImage?`, `showPhoto: boolean`, `size: "xs"|"sm"|"md"|"lg"|"xl"`
- `showPhoto=true` + `profileImage` → renderiza `<img>`
- Caso contrário → iniciais (`name.substring(0,2).toUpperCase()`)
- `showPhoto` vem de `settings.show_user_photos !== "false"` via `usePlatformSettings()`
- **Foto do próprio usuário** (nav, compositor de post): sempre usa `showPhoto={true}`

---

## 7. Webchat — Balão de Suporte

O frontend integra o **ChatbotMaker (CBM)** como canal de suporte via widget flutuante, carregado diretamente no `index.html`.

### Inicialização

```html
<!-- index.html -->
<script>
  window.cbAsyncInit = function () {
    CBM.ChatbotId = "cb11077427";

    // Passa nome e email do usuário logado para o widget
    var chatUser;
    try {
      var raw = localStorage.getItem("nimbus_user");
      if (raw) {
        var u = JSON.parse(raw);
        chatUser = { name: u.name || undefined, email: u.email || undefined };
      }
    } catch (e) {}

    CBM.StartWebChat(chatUser, false, null).catch(function () {});
  };

  // Carrega o SDK do ChatbotMaker de forma assíncrona
  (function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) { return; }
    js = d.createElement(s); js.id = id;
    js.src = "https://webchat.chatbotmaker.io/cbm-jssdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'cbm-jssdk'));
</script>
```

### Comportamento por Dispositivo

| Dispositivo | Comportamento |
|---|---|
| **Desktop** | Botão flutuante (`.__talkjs_launcher`) com `opacity: 0.45`; hover → `opacity: 1` |
| **Mobile** | Botão flutuante oculto (`display: none`) quando fechado; acessível pelo ícone `MessageCircle` no header; quando aberto, reposicionado a `bottom: 80px` (acima da bottom nav) |

O botão no header mobile (`app-shell.tsx`) aciona o widget programaticamente:
```tsx
onClick={() => (document.querySelector('.__talkjs_launcher') as HTMLElement)?.click()}
```

---

## 8. Fluxo de Autenticação

```
1. POST /auth/login { email, password }
   → Valida com LoginDto (class-validator)
   → Compara bcrypt
   → Retorna { token (JWT 7d), user }

2. Frontend guarda token em localStorage["suri_token"]
   e dados do usuário em localStorage["nimbus_user"]

3. Todas as requisições autenticadas incluem:
   Authorization: Bearer <token>

4. Backend valida via JwtStrategy (passport-jwt)
   → req.user = { sub: userId, email, isAdmin, ... }

5. Guards:
   @UseGuards(AuthGuard('jwt')) → requer JWT válido
   if (!req.user.isAdmin) throw ForbiddenException → requer admin

6. Logout: remove token e dados do localStorage + limpa cache de API
```

---

## 9. Modelo de Segurança

### CORS
Configurado em `main.ts` com lista de origens permitidas via `ALLOWED_ORIGINS` (env var).
```
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5175,https://app.suri.com.br
```

### Helmet (HTTP Security Headers)
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 0` (legacy)
- `Content-Security-Policy`: permite YouTube iframes e uploads próprios
- `crossOriginEmbedderPolicy: false` (necessário para vídeos YouTube)

### Rate Limiting (@nestjs/throttler)
- Global: 100 requests / 60 segundos por IP
- Login e Signup: 10 requests / 60 segundos por IP

### Validação de Input (class-validator)
- `ValidationPipe({ whitelist: true, transform: true })` global
- Campos desconhecidos são ignorados (whitelist) — não causam erro
- DTOs em `backend/src/infrastructure/http/dtos/auth.dto.ts`:
  - `LoginDto`, `SignupDto`, `UpdateProfileDto`, `PhotoVisibilityDto`

### Upload de Arquivos
- Validação de extensão: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.svg`
- Limite: 5MB por arquivo
- Armazenados em `/uploads/avatares/` e `/uploads/logos/` com nome UUID

### SQL Injection
Prisma ORM usa parameterized queries — SQL injection prevenido por padrão.

### Proteção de Rotas Admin
Verificação manual em cada endpoint sensível:
```typescript
if (!req.user.isAdmin) throw new ForbiddenException('...');
```

### Progressão Sequential de Aulas
`POST /enrollments/lessons/:lessonId/complete` valida se a aula anterior foi concluída antes de marcar a atual.

---

## 10. Features de Administrador

### Gerenciamento de Usuários (`/admin`)
- Listar, buscar, filtrar usuários (ativos/inativos/newsletter)
- Editar: nome, grupo, tier, nível, empresa
- Ativar/desativar contas
- Contadores: total, ativos, inativos

### Toggle de Fotos de Perfil (`/admin` → card "Configurações da Plataforma")
- Switch que chama `PATCH /settings/photo-visibility { enabled: boolean }`
- Efeito propagado em ≤60s para todos os usuários logados (via polling no SettingsProvider)
- Quando desativado: `UserAvatar` exibe iniciais em todo o app (Ranking, Dashboard, posts)
- A foto do **próprio usuário** no nav/perfil não é afetada

### Gerenciamento de Cursos (`/admin/cursos`)
- CRUD completo de cursos, aulas e capa
- Toggle de publicação
- Configuração de grupo-alvo (all/vip/embaixador), XP, carga horária

### Roadmaps (`/admin/roadmap`)
- CRUD de roadmaps e itens (vídeo/documento/referência)
- Toggle isActive: usuários veem apenas roadmaps ativos
- Mudanças refletem nos usuários em ≤30s (polling no RoadmapPage)

### Grupos e Tiers (`/admin/grupos`)
- Define regras de progressão: faixa de XP → tier
- Distribuição de usuários por grupo/tier

### Logotipos (`/admin/logotipos`)
- Upload de 4 variantes de logo (expandido/colapsado × claro/escuro)

### Relatórios (`/admin/relatorios`)
- Matrículas, certificados, taxa de aprovação
- Segmentado por grupo e curso

### Quiz e Provas (`/admin/provas`)
- Criar/editar questões de múltipla escolha por curso
- Tentativas extras para usuários específicos

### Tokens de API Externa (`/admin/api-tokens`)
- Criar tokens com nome e data de expiração opcional
- Token exibido uma única vez no momento da criação (`suri_<64hex>`)
- Ativar/desativar e revogar tokens
- Listar tokens com `lastUsedAt` para auditoria de uso

---

## 11. Setup de Desenvolvimento

### Pré-requisitos
- Node.js 20+
- Docker Desktop

### Inicialização com Docker

```bash
# Na raiz do projeto
docker-compose up -d

# Backend estará em http://localhost:3000
# Frontend em http://localhost:80
# MongoDB em localhost:27017
```

### Desenvolvimento Local

```bash
# Backend
cd backend
cp .env.example .env
# Edite DATABASE_URL apontando para o MongoDB local ou MongoDB Atlas
npm install
npx prisma migrate dev
npm run start:dev

# Frontend (outro terminal)
cd frontend
npm install
npm run dev  # Porta 5175
```

### Variáveis de Ambiente Obrigatórias

```env
DATABASE_URL=mongodb://localhost:27017/suri
JWT_SECRET=sua_chave_secreta_minimo_32_caracteres
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5175
FRONTEND_URL=http://localhost:5173
```

### Swagger / Documentação da API

Disponível em `http://localhost:3000/api/docs` quando o backend está rodando.

---

## 12. Histórico de Features

### API Externa (tokens de integração)
- Novo model `ApiToken` com `tokenHash` SHA256, `isActive`, `expiresAt`, `lastUsedAt`
- 15 endpoints GET sob `/external/*` autenticados via `ApiTokenStrategy` (passport-custom)
- `AdminApiTokenController` (`/admin/api-tokens`) para gerenciar tokens: criar, listar, ativar/desativar, revogar
- Token em claro retornado **apenas na criação**; valor nunca armazenado em texto simples
- `ApiTokenGuard` aplicado globalmente em `ExternalApiController`

### Webchat ChatbotMaker (balão de suporte)
- Widget CBM carregado em `index.html` via SDK assíncrono `cbm-jssdk.js`
- `CBM.ChatbotId = "cb11077427"` com inicialização do usuário logado via `localStorage["nimbus_user"]`
- Desktop: botão flutuante com opacidade reduzida (0.45 → 1.0 no hover)
- Mobile: botão flutuante oculto; acionado pelo ícone `MessageCircle` no header; reposicionado acima da bottom nav quando aberto

### Toggle de Visibilidade de Fotos
- Chave `show_user_photos` em `SystemSetting`
- Endpoint `PATCH /settings/photo-visibility` (admin only)
- Componente `UserAvatar` centraliza lógica de foto vs iniciais
- Toggle na `AdminPanel` com switch + toast de confirmação

### Polling e Cache de Consultas
- `useCachedRequest` hook com cache de módulo e TTL configurável
- Roadmap: polling de 30 segundos (admin ativa → usuário vê sem reload)
- SettingsProvider: polling de 60 segundos para `show_user_photos`
- Dashboard: leaderboard cacheado por 120s; evita consultas desnecessárias
- `clearApiCache()` chamado no logout para limpar dados do usuário anterior

### Segurança Base
- CORS restrito a `ALLOWED_ORIGINS` (sem wildcard em produção)
- Helmet com CSP configurada (permite YouTube iframes)
- Rate limiting global (100/min) + estrito em auth (10/min)
- ValidationPipe global com DTOs para login, signup, update de perfil

### Ajustes Mobile
- Font-size base: 13.5px → 14px (desktop); 13px → 13.5px (< 480px)
- Leaderboard: avatars do pódio maiores (size-20), lista com p-5
- Dashboard: gaps e margens de seção aumentados (mt-12, gap-8)
- Roadmap: card padding aumentado (p-6 pb-5)
