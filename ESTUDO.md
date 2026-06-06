# Guia de Estudo — Universidade Suri (Ponta a Ponta)

Roteiro progressivo para entender o projeto completo. Cada módulo tem conceito, arquivos para ler,
experimento prático e perguntas de verificação. Faça na ordem — cada módulo depende do anterior.

---

## Como usar este guia

- Leia o conceito, abra os arquivos indicados no VS Code, faça o experimento
- Responda as perguntas de checkpoint mentalmente antes de avançar
- Marque `[x]` nos módulos concluídos
- Tempo estimado total: **6–10 horas** distribuídas

---

## Checklist de progresso

- [ ] Módulo 1 — Visão Geral e Ambiente
- [ ] Módulo 2 — Banco de Dados (Prisma)
- [ ] Módulo 3 — Arquitetura do Backend (NestJS)
- [ ] Módulo 4 — Autenticação (JWT + API Token)
- [ ] Módulo 5 — Domínio e Regras de Negócio
- [ ] Módulo 6 — Controllers e Endpoints
- [ ] Módulo 7 — Frontend: Estrutura e Roteamento
- [ ] Módulo 8 — Frontend: Auth, Estado e API
- [ ] Módulo 9 — Features Completas (fluxo de ponta a ponta)
- [ ] Módulo 10 — Design System
- [ ] Módulo 11 — Segurança e Configurações

---

## Módulo 1 — Visão Geral e Ambiente

### Conceito

O projeto é um **monorepo** com duas aplicações independentes:

```
universidade-suri/
├── backend/    → API REST (NestJS + Prisma + PostgreSQL)
└── frontend/   → SPA (React + Vite + TypeScript + Tailwind)
```

Elas se comunicam via HTTP: o frontend chama a API do backend. Não há SSR, não há monolito.
O banco de dados só o backend acessa — o frontend nunca toca no banco diretamente.

```
[Browser] ←→ [React SPA :5173] ←→ [NestJS API :3000] ←→ [PostgreSQL :5435]
```

### Como rodar

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env        # configurar DATABASE_URL, JWT_SECRET, etc.
npm install
npm run db:migrate
npm run db:seed             # cria admin@suri.com / SuriAdmin123
npm run start:dev           # API em http://localhost:3000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev                 # SPA em http://localhost:5173
```

### Swagger (documentação interativa da API)

Com o backend rodando, abra: `http://localhost:3000/api/docs`
Você verá todos os endpoints com descrição, parâmetros e exemplos de resposta.

### Arquivos para ler agora

| Arquivo | Por que ler |
|---------|-------------|
| `backend/src/main.ts` | Ponto de entrada — onde o NestJS é configurado |
| `backend/src/app.module.ts` | Coração do backend — todos os módulos registrados |
| `frontend/src/App.tsx` | Ponto de entrada do React — todas as rotas |
| `frontend/src/main.tsx` | Onde os providers são montados |

### Checkpoint

- Qual porta o backend usa? Qual o frontend?
- Onde está a documentação Swagger?
- O que é o `app.module.ts` e por que tudo está lá?

---

## Módulo 2 — Banco de Dados (Prisma)

### Conceito

O banco é PostgreSQL gerenciado pelo **Prisma ORM**. A fonte da verdade é um único arquivo:

```
backend/prisma/schema.prisma
```

Prisma lê esse arquivo e gera o `PrismaClient` — um objeto TypeScript que você usa para
consultar o banco com segurança de tipos. Nunca escrevemos SQL manualmente.

### Os 24 models do schema

Abra `backend/prisma/schema.prisma` e identifique os grupos:

**Usuários e acesso**
- `Profile` — o usuário (nome, email, senha hash, XP, nível, grupo, tier)
- `UserRole` — papéis auxiliares
- `GroupRule` — faixas de XP → tier (ex.: 0-999 XP = VIP PLUS)
- `SystemSetting` — configurações globais (logos, visibilidade de fotos)
- `ApiToken` — tokens para sistemas externos
- `XpRule` — configuração de XP por ação

**Cursos e progresso**
- `Course` — o curso (título, descrição, XP de recompensa, grupo alvo)
- `Module` — aula dentro do curso (vídeo, ordem, duração)
- `Enrollment` — matrícula de um usuário em um curso
- `ModuleProgress` — rastreia se o aluno concluiu cada aula

**Certificados**
- `Certificate` — certificado de conclusão de curso

**Quizzes**
- `Question` — questão com alternativas e resposta correta
- `QuizAttempt` + `QuizAttemptAnswer` — tentativa do aluno no quiz
- `QuizExtraAttempt` — tentativa extra concedida pelo admin

**Trilhas**
- `Trail` — trilha de aprendizado (agrupa cursos)
- `TrailCourse` — quais cursos compõem a trilha
- `TrailEnrollment` — inscrição do aluno na trilha
- `TrailCertificate` — certificado de conclusão da trilha
- `TrailQuizAttempt` + `TrailQuizAttemptAnswer` — tentativas do exame final

**Comunidade**
- `Post` + `PostLike` + `PostComment` — feed social

**Roadmap**
- `Roadmap` + `RoadmapItem` — conteúdo curado pelo admin

### Convenção do Prisma

```prisma
model Profile {
  id    String @id @default(uuid()) @db.Uuid  // PK gerada automaticamente
  email String @unique                          // constraint única
  
  // camelCase no código TypeScript
  passwordHash String @map("password_hash")    // snake_case no banco
  
  enrollments Enrollment[]                      // relação 1→N
  @@map("profiles")                             // nome da tabela no banco
}
```

O `@map` e `@@map` são a ponte entre o mundo TypeScript (camelCase) e o banco (snake_case).

### Como o Prisma é usado no código

```typescript
// PrismaService injeta o PrismaClient
const user = await this.prisma.profile.findUnique({
  where: { email: 'joao@empresa.com' }
});

const cursos = await this.prisma.course.findMany({
  where: { isPublished: true, targetGroup: { in: ['all', 'vip'] } },
  include: { modules: { orderBy: { sortOrder: 'asc' } } }
});
```

### Arquivos para ler agora

| Arquivo | Por que ler |
|---------|-------------|
| `backend/prisma/schema.prisma` | Schema completo — leia linha a linha, entenda as relações |
| `backend/src/infrastructure/database/prisma.service.ts` | Como o PrismaClient é disponibilizado |

### Experimento

1. Com o backend rodando, abra o Swagger em `http://localhost:3000/api/docs`
2. Faça `POST /auth/login` com `admin@suri.com` / `SuriAdmin123`
3. Copie o `token` da resposta
4. Use o token no botão "Authorize" do Swagger
5. Chame `GET /auth/users` — veja os dados do banco sendo retornados

### Checkpoint

- Onde fica a fonte da verdade do banco?
- Qual a diferença entre `@map` e `@@map`?
- O que é um `Enrollment`? Qual a diferença de `Enrollment` e `ModuleProgress`?
- Por que `Certificate` tem `verificationCode` único?

---

## Módulo 3 — Arquitetura do Backend (NestJS)

### Conceito

O backend usa **Clean Architecture** simplificada com 3 camadas:

```
src/
├── domain/           → regras de negócio puras (sem framework)
│   ├── entities/     → classes de domínio: User, Course, Post, etc.
│   └── repositories/ → interfaces (contratos): IUserRepository
│
├── infrastructure/   → implementações concretas (banco, HTTP)
│   ├── database/
│   │   ├── prisma.service.ts        → PrismaClient injetável
│   │   └── repositories/            → PrismaUserRepository, etc.
│   └── http/
│       ├── controllers/             → recebem HTTP, orquestram, respondem
│       ├── dtos/                    → validação de entrada (class-validator)
│       ├── guards/                  → ApiTokenGuard
│       └── strategies/              → jwt.strategy, api-token.strategy
│
└── app.module.ts     → único módulo — registra tudo
```

### Padrão de Injeção de Dependência (o mais importante)

O NestJS usa injeção de dependência (DI). Você **não instancia classes manualmente** — o framework
faz isso. O padrão usado aqui é injetar por **token de interface**:

```typescript
// app.module.ts — registra a implementação concreta para a interface
{
  provide: IUserRepository,    // token (a interface)
  useClass: PrismaUserRepository  // implementação real
}

// auth.controller.ts — recebe a implementação sem saber qual é
constructor(
  @Inject(IUserRepository)
  private readonly userRepository: IUserRepository,
) {}
```

**Por que isso é bom?** Se você quiser trocar PostgreSQL por MongoDB, só troca a implementação
(`PrismaUserRepository` → `MongoUserRepository`) sem tocar no controller.

### Fluxo de uma requisição

```
HTTP Request
    ↓
[Guard] (verifica JWT ou ApiToken)
    ↓
[Controller] (recebe @Body, @Param, @Query, @Req)
    ↓
[Repository] (busca/salva no banco via Prisma)
    ↓
HTTP Response
```

Nota: a pasta `application/` (casos de uso) está reservada mas não usada ainda.
A lógica de negócio vive principalmente nos controllers.

### Arquivos para ler agora

| Arquivo | Por que ler |
|---------|-------------|
| `backend/src/app.module.ts` | Registro de todos os controllers, providers e repositórios |
| `backend/src/domain/entities/user.entity.ts` | A entidade mais simples — base para entender as demais |
| `backend/src/domain/repositories/user.repository.interface.ts` | O contrato que o controller conhece |
| `backend/src/infrastructure/database/repositories/prisma-user.repository.ts` | A implementação real |

### Experimento

Abra `user.repository.interface.ts` e `prisma-user.repository.ts` lado a lado.
Para cada método da interface (ex.: `findByEmail`), encontre a implementação no repositório.
Perceba que a implementação usa `this.prisma.profile.findUnique(...)`.

### Checkpoint

- Qual a diferença entre `domain/` e `infrastructure/`?
- Por que o controller não importa diretamente o `PrismaUserRepository`?
- O que acontece se a interface `IUserRepository` tiver um método novo mas o repositório não implementar?

---

## Módulo 4 — Autenticação (JWT + API Token)

### Conceito

Existem **dois sistemas de autenticação independentes**:

#### 1. JWT — para usuários da plataforma

```
Login → backend gera JWT → frontend guarda em localStorage["suri_token"]
       ↓
Próximas requisições: Authorization: Bearer <jwt>
       ↓
jwt.strategy.ts verifica a assinatura e popula req.user
       ↓
@UseGuards(AuthGuard('jwt')) protege a rota
```

O JWT contém `{ sub: userId, email }` e expira em **7 dias**.

**Verificação de admin**: não existe um guard separado para admin. O controller
verifica manualmente:
```typescript
if (!req.user.isAdmin) throw new ForbiddenException('...');
```

#### 2. API Token — para sistemas externos

```
Admin cria token → backend gera "suri_<64hex>" e salva SHA256(token) no banco
                                                      ↓
Sistema externo envia: Authorization: Bearer suri_<token>
                                                      ↓
api-token.strategy.ts calcula SHA256 e compara com tokenHash no banco
                                                      ↓
@UseGuards(ApiTokenGuard) protege rotas /external/*
```

O token em claro nunca é salvo — só o hash. Por isso, se perder, precisa criar outro.

#### Reset de senha

```
POST /auth/forgot-password → gera UUID token, salva no Profile com expiry de 24h
POST /auth/reset-password  → valida token, aplica bcrypt, apaga token do Profile
```

### Arquivos para ler agora

| Arquivo | Por que ler |
|---------|-------------|
| `backend/src/infrastructure/http/strategies/jwt.strategy.ts` | Como o JWT é validado |
| `backend/src/infrastructure/http/strategies/api-token.strategy.ts` | Como o API Token é validado |
| `backend/src/infrastructure/http/guards/api-token.guard.ts` | O guard que usa a strategy |
| `backend/src/infrastructure/http/controllers/auth.controller.ts` | Login, signup, perfil, reset |
| `frontend/src/lib/auth.tsx` | Como o frontend guarda e usa o token |
| `frontend/src/lib/api.ts` | Como o token é injetado em cada requisição |

### Experimento

1. Abra `frontend/src/lib/api.ts` e localize onde o token é lido do `localStorage`
2. Abra `frontend/src/lib/auth.tsx` e veja o que acontece no `login()` e `logout()`
3. No Swagger, tente chamar `GET /auth/me` **sem** o token — veja o erro 401
4. Agora authorize e chame novamente — veja os dados do usuário

### Checkpoint

- O que está dentro do payload do JWT?
- Por que o `req.user` em qualquer controller já tem o objeto `User` completo?
- Qual a diferença entre `AuthGuard('jwt')` e `ApiTokenGuard`?
- Por que o API Token é armazenado como SHA256 e não em claro?

---

## Módulo 5 — Domínio e Regras de Negócio

### Conceito

As **entidades de domínio** (`domain/entities/`) são classes TypeScript puras — sem decorators de
framework, sem Prisma, sem HTTP. Elas contêm regras de negócio que não dependem de nada externo.

#### User (`user.entity.ts`)

```typescript
addXp(amount: number): void {
  if (this.isAdmin) return;               // ← regra: admin nunca ganha XP
  this.xp += amount;
  const newLevel = Math.floor(this.xp / 1000) + 1;  // ← 1000 XP = 1 nível
  if (newLevel > this.level) this.level = newLevel;
}
```

#### Regras críticas do sistema

| Regra | Onde é aplicada |
|-------|----------------|
| Conclusão de aulas é sequencial | `enrollment.controller.ts` — verifica sortOrder anterior |
| Quiz: máx 3 tentativas, ≥70% aprovação | `quiz.controller.ts` |
| Exame de trilha: disponível só com 100% dos módulos | `trail.controller.ts` |
| Admin não acumula XP | `user.entity.ts → addXp()` |
| Feed segmentado por groupType | `post.controller.ts` — filtra por groupType |
| Token API: exibido só na criação | `admin-api-token.controller.ts` |
| XP configurável por XpRule | controllers lêem do banco com fallback |

#### Grupos e Tiers

```
groupType: "vip"        → tiers: "VIP PLUS" → "VIP GOLD" → "VIP PLATINUM"
groupType: "embaixador" → tiers: "Embaixador Voice" → "Embaixador Elite" → "Embaixador Icon"
isAdmin: true           → badge "ADMINISTRADOR" (sem grupo, sem XP)
```

O `tier` de um aluno pode ser recalculado com base nas faixas de XP definidas nas `GroupRule`.

### Arquivos para ler agora

| Arquivo | Por que ler |
|---------|-------------|
| `backend/src/domain/entities/user.entity.ts` | Entidade base + regra de XP |
| `backend/src/domain/entities/course.entity.ts` | Validações de curso |
| `backend/src/domain/entities/certificate.entity.ts` | Geração de código de certificado |
| `backend/src/domain/entities/post.entity.ts` | Regras do feed |

### Experimento

1. Leia `user.entity.ts` linha a linha — são apenas ~30 linhas
2. Encontre no `enrollment.controller.ts` onde a conclusão sequencial é verificada
   (procure por `sortOrder` e `isCompleted`)
3. Encontre no `quiz.controller.ts` onde a contagem de tentativas é feita

### Checkpoint

- Por que separar entidades de domínio dos controllers?
- O que acontece se você chamar `addXp(100)` num admin?
- Como o sistema sabe se o aluno pode avançar para a próxima aula?
- O que é `isFirstLogin` e como é calculado?

---

## Módulo 6 — Controllers e Endpoints

### Conceito

Cada controller é uma classe com decorators que mapeiam métodos HTTP para funções TypeScript:

```typescript
@ApiTags('auth')
@Controller('auth')           // prefixo de rota: /auth
export class AuthController {
  
  @Post('login')              // rota completa: POST /auth/login
  async login(@Body() body: LoginDto) {
    // ...
  }
  
  @Get('me')                  // rota completa: GET /auth/me
  @UseGuards(AuthGuard('jwt')) // protege a rota
  async getProfile(@Req() req: any) {
    const user = req.user;    // populado pelo jwt.strategy
    // ...
  }
}
```

### Mapa completo de controllers

| Controller | Prefixo | Funcionalidade |
|-----------|---------|----------------|
| `auth.controller.ts` | `/auth` | Login, signup, perfil, usuários (admin), leaderboard, reset senha |
| `course.controller.ts` | `/courses` | CRUD de cursos, listagem filtrada por grupo |
| `enrollment.controller.ts` | `/enrollments` | Matrículas, conclusão sequencial de aulas |
| `certificate.controller.ts` | `/certificates` | Geração e validação de certificados |
| `quiz.controller.ts` | `/quiz` | CRUD de questões, tentativas, extras |
| `trail.controller.ts` | `/trails` | CRUD de trilhas, inscrição, exame final |
| `post.controller.ts` | `/posts` | Feed da comunidade, curtidas, comentários |
| `roadmap.controller.ts` | `/roadmaps` | Conteúdo curado, CRUD admin |
| `settings.controller.ts` | `/settings` | Configurações globais (logos, foto) |
| `changelog.controller.ts` | `/changelog` | Versões da plataforma (JSON files) |
| `gamification.controller.ts` | `/gamification` | XpRules + GroupRules |
| `admin-groups.controller.ts` | `/admin/groups` | CRUD de GroupRules |
| `admin-reports.controller.ts` | `/admin/reports` | Relatórios |
| `admin-api-token.controller.ts` | `/admin/api-tokens` | Tokens de API externa |
| `gamification.controller.ts` | `/admin/gamification` | Edição de XpRules |
| `external-api.controller.ts` | `/external` | 15 endpoints somente-leitura (API Token) |

### Padrão de validação de entrada (DTOs)

```typescript
// auth.dto.ts
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

// controller usa o DTO como tipo do body — ValidationPipe valida automaticamente
@Post('login')
async login(@Body() body: LoginDto) { ... }
```

Se o body não passar na validação, o NestJS retorna `400 Bad Request` automaticamente.

### Arquivos para ler agora (escolha 2–3)

| Arquivo | Complexidade | Por que ler |
|---------|-------------|-------------|
| `backend/src/infrastructure/http/controllers/auth.controller.ts` | Média | Mais completo — cobre login, admin, upload |
| `backend/src/infrastructure/http/controllers/enrollment.controller.ts` | Alta | Regra sequencial — a mais importante |
| `backend/src/infrastructure/http/controllers/quiz.controller.ts` | Média | Tentativas, bloqueio, extras |
| `backend/src/infrastructure/http/dtos/auth.dto.ts` | Baixa | Padrão de DTO |

### Experimento

1. No Swagger, explore os endpoints de `/enrollments`
2. Tente fazer `POST /enrollments/{courseId}/join` com um courseId existente
3. Depois `GET /enrollments/my-enrollments` para ver a matrícula criada
4. Agora tente `POST /enrollments/lessons/{lessonId}/complete` — observe o comportamento sequencial

### Checkpoint

- O que são DTOs e para que servem?
- Quem valida o body antes de chegar ao controller?
- Como o controller sabe se o usuário é admin sem um guard especial?
- O que retorna `GET /auth/me`? Por que `isFirstLogin` é calculado nessa rota?

---

## Módulo 7 — Frontend: Estrutura e Roteamento

### Conceito

O frontend é uma **SPA (Single Page Application)** — uma única página HTML que o JavaScript
popula dinamicamente. A navegação não recarrega a página; o React Router intercepta as URLs.

```
index.html → main.tsx → App.tsx → [Routes] → [Pages]
```

#### Providers (contextos globais)

Em `App.tsx`, os providers envolvem tudo:

```tsx
<AuthProvider>        // gerencia usuário logado, login, logout
  <TourProvider>      // guided tour (react-joyride)
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>         // redireciona para /login se não autenticado
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <AdminRoute>             // redireciona para /dashboard se não é admin
          <AdminPanelPage />
        </AdminRoute>
      } />
    </Routes>
  </TourProvider>
</AuthProvider>
```

#### Rotas do sistema

| Rota | Acesso | Página |
|------|--------|--------|
| `/` | Público | Landing page |
| `/login` | Público | Tela de auth |
| `/esqueceu-senha` | Público | Forgot password |
| `/certificado/:codigo` | Público | Visualização de certificado |
| `/dashboard` | Aluno | Painel principal |
| `/cursos` | Aluno | Catálogo de cursos |
| `/cursos/:courseId` | Aluno | Player de curso (aulas) |
| `/trilhas` | Aluno | Trilhas de aprendizado |
| `/ranking` | Aluno | Leaderboard de XP |
| `/roadmap` | Aluno | Conteúdo curado |
| `/gamificacao` | Aluno | XP, níveis e tiers |
| `/perfil` | Aluno | Perfil e avatar |
| `/admin` | Admin | Painel admin |
| `/admin/cursos` | Admin | Gestão de cursos |
| `/admin/trilhas` | Admin | Gestão de trilhas |
| `/admin/provas` | Admin | Gestão de quizzes |
| `/admin/grupos` | Admin | GroupRules e tiers |
| `/admin/relatorios` | Admin | Relatórios |
| `/admin/gamificacao` | Admin | Edição de XpRules |
| `/admin/tokens` | Admin | API Tokens externos |

### Arquivos para ler agora

| Arquivo | Por que ler |
|---------|-------------|
| `frontend/src/App.tsx` | Rotas, ProtectedRoute, AdminRoute |
| `frontend/src/main.tsx` | Entry point — providers e configuração global |
| `frontend/src/pages/Dashboard.tsx` | Página mais representativa do aluno |
| `frontend/src/pages/AdminPanel.tsx` | Página mais representativa do admin |

### Checkpoint

- Como o `ProtectedRoute` sabe se o usuário está logado?
- O que acontece se um aluno tentar acessar `/admin`?
- Onde ficam os providers e em que ordem são montados?
- Qual a diferença entre uma rota pública e uma protegida no código?

---

## Módulo 8 — Frontend: Auth, Estado e API

### Conceito

#### Como a autenticação funciona no frontend

```typescript
// lib/auth.tsx — AuthProvider
const login = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, { ... });
  const { token, user } = await res.json();
  
  localStorage.setItem('suri_token', token);       // JWT guardado
  localStorage.setItem('nimbus_user', JSON.stringify(user)); // usuário guardado
  setUser(user);                                    // estado React atualizado
};

const logout = () => {
  localStorage.removeItem('suri_token');
  localStorage.removeItem('nimbus_user');
  clearApiCache();                                  // limpa cache de requisições
  setUser(null);
};
```

#### Como fazer chamadas para a API

```typescript
// lib/api.ts — apiRequest
export const apiRequest = async (url: string, options?: RequestInit) => {
  const token = localStorage.getItem('suri_token');
  return fetch(`${import.meta.env.VITE_API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
};

// Uso em qualquer página:
const res = await apiRequest('/courses');
const cursos = await res.json();
```

#### Cache de requisições

```typescript
// hooks/useCachedRequest.ts
const { data, loading } = useCachedRequest<Course[]>('/courses', 120);
//                                                              ↑ TTL em segundos
// Segunda chamada dentro de 120s não vai à rede — usa o Map global
```

#### Padrão de loading/erro em páginas

```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  apiRequest('/alguma-rota')
    .then(res => res.json())
    .then(setData)
    .catch(e => toast.error('Erro ao carregar dados'))
    .finally(() => setLoading(false));  // ← sempre para o loading
}, []);

if (loading) return <Spinner />;
```

### Arquivos para ler agora

| Arquivo | Por que ler |
|---------|-------------|
| `frontend/src/lib/auth.tsx` | AuthProvider completo — login, logout, persistência |
| `frontend/src/lib/api.ts` | apiRequest — injeção automática do JWT |
| `frontend/src/hooks/useCachedRequest.ts` | Cache com TTL |
| `frontend/src/lib/settings.tsx` | SettingsProvider — polling de configurações |

### Experimento

1. Abra o DevTools do browser (F12) → Application → Local Storage
2. Faça login na plataforma e observe os valores de `suri_token` e `nimbus_user`
3. Abra a aba Network e navegue entre páginas — note quais requisições vão à rede e quais usam cache
4. Faça logout e observe o localStorage ser limpo

### Checkpoint

- Onde o token JWT fica guardado no browser?
- Por que `apiRequest` e não `fetch` diretamente?
- O que `clearApiCache()` faz e quando é chamado?
- Como o `SettingsProvider` garante que logos atualizadas apareçam sem refresh?

---

## Módulo 9 — Features Completas (Fluxo Ponta a Ponta)

Aqui vamos traçar o caminho completo de 3 features — do banco ao browser.

---

### Feature A: Aluno conclui uma aula

**1. Banco** (`module_progress`)
Tabela que rastreia cada aula concluída. Chave única: `(enrollmentId, moduleId)`.

**2. Backend** (`enrollment.controller.ts`)
```
POST /enrollments/lessons/:lessonId/complete
  → busca o módulo pelo lessonId → pega sortOrder
  → busca o módulo anterior (sortOrder - 1)
  → verifica se ModuleProgress.isCompleted = true para o anterior
  → se não: erro 400 "Conclua a aula anterior primeiro"
  → se sim: cria/atualiza ModuleProgress com isCompleted = true
  → verifica se TODOS os módulos do curso estão concluídos
  → se sim: marca Enrollment.completedAt = now()
```

**3. Frontend** (`CoursePlayer.tsx`)
```
Botão "Concluir aula" → apiRequest('POST /enrollments/lessons/:id/complete')
  → sucesso: toast "Aula concluída!" + avança para próxima aula
  → erro: toast com a mensagem do backend
```

---

### Feature B: Aluno faz o quiz de um curso

**1. Banco** (`quiz_attempts`, `quiz_attempt_answers`, `questions`)
Cada tentativa salva o score e todas as respostas.

**2. Backend** (`quiz.controller.ts`)
```
POST /quiz/:courseId/submit → { answers: [{ questionId, selectedOption }] }
  → conta quantas perguntas existem para o curso
  → compara cada `selectedOption` com `question.answer`
  → score = (corretas / total) * 100
  → passed = score >= 70
  → attemptNumber = tentativas anteriores + 1
  → se attemptNumber > 3 + extraAttempts: erro "Tentativas esgotadas"
  → salva QuizAttempt + QuizAttemptAnswers
  → se passed: addXp(course.xpReward) ao usuário
```

**3. Frontend** (dentro de `CoursePlayer.tsx` ou página dedicada)
```
Exibe questões → aluno escolhe alternativas → submit
  → apiRequest('POST /quiz/:courseId/submit')
  → exibe resultado: score, passou/reprovou, tentativas restantes
  → se passou: botão "Gerar Certificado"
```

---

### Feature C: Aluno se inscreve em uma trilha e faz o exame final

**1. Banco** (`trail_enrollments`, `trail_quiz_attempts`, `trail_certificates`)

**2. Backend** (`trail.controller.ts`)
```
POST /trails/:id/enroll → cria TrailEnrollment

GET /trails/:id/exam/status
  → verifica se 100% dos módulos de TODOS os cursos da trilha estão concluídos
  → retorna: { eligible, attemptCount, passed, certificateCode? }

POST /trails/:id/exam/submit
  → mesma lógica do quiz de curso
  → se passed: concede XpRule(trail_exam) XP + emite TrailCertificate
```

**3. Frontend** (`TrailsList.tsx`)
```
Aba "Catálogo" → botão "Inscrever-se" → POST /trails/:id/enroll
Aba "Minhas Trilhas" → barra de progresso → botão "Fazer Exame" (se 100%)
  → GET /trails/:id/exam/questions → exibe questões
  → POST /trails/:id/exam/submit → exibe resultado + certificado
```

### Arquivos para ler agora

| Arquivo | Por que ler |
|---------|-------------|
| `backend/src/infrastructure/http/controllers/enrollment.controller.ts` | Conclusão sequencial |
| `backend/src/infrastructure/http/controllers/quiz.controller.ts` | Lógica de tentativas |
| `backend/src/infrastructure/http/controllers/trail.controller.ts` | Trilhas e exame final |
| `frontend/src/pages/CoursePlayer.tsx` | Player de aulas com quiz |
| `frontend/src/pages/TrailsList.tsx` | Inscrição e exame de trilha |

### Checkpoint

- O que acontece se o aluno tentar concluir a aula 3 sem ter concluído a aula 2?
- Qual é o critério exato para o exame de trilha ficar disponível?
- Após reprovar 3 vezes no quiz, como o admin libera mais uma tentativa?
- O certificado de trilha e o de curso têm prefixos diferentes — quais são?

---

## Módulo 10 — Design System

### Conceito

O design usa **Tailwind CSS v4** com tokens de cor customizados em `frontend/src/styles.css`.
Há dois temas alternados pela classe `.dark` no elemento `<html>`:

- **Snow Blue** (claro) — background azul-lavanda suave
- **Night Blue** (escuro) — background quase preto levemente azulado

### Tokens principais

```css
/* frontend/src/styles.css */
:root {                              /* Tema claro (Snow Blue) */
  --background: 218 42% 91%;        /* azul-lavanda */
  --primary:    234 85% 45%;        /* azul primário vibrante */
  --secondary:  237 90% 63%;        /* Suri Blue */
  --card:       0 0% 100%;          /* branco puro */
}

.dark {                             /* Tema escuro (Night Blue) */
  --background: 222 22% 8%;         /* quase preto azulado */
  --primary:    237 90% 65%;        /* Suri Blue mais vibrante */
  --card:       222 22% 11%;        /* card escuro */
}
```

Os valores são **HSL sem `hsl()`** — isso permite controle de opacidade com Tailwind:
`bg-primary/50` = cor primária com 50% de opacidade.

### Classes utilitárias customizadas

| Classe | Efeito visual |
|--------|--------------|
| `.bg-gradient-card` | Glassmorphism (vidro translúcido + blur) |
| `.text-gradient` | Texto com gradiente primary→secondary |
| `.hover-lift` | Sobe 4px + glow no hover |
| `.watermark-bg` | Logo TOTVS como marca d'água |
| `.glass-card` | Variação de glassmorphism theme-aware |

### Ícones

**Apenas `lucide-react`**. Nunca outra biblioteca.

```typescript
import { BookOpen, Zap, Shield, Sparkles } from 'lucide-react';
```

### Componentes base

Em `frontend/src/components/ui/` — baseados em Radix UI via shadcn:
`Button`, `Card`, `Input`, `Dialog`, `Sheet`, `Tabs`, `Badge`, `Progress`, etc.

Nunca criar botão ou card do zero — sempre usar ou customizar os existentes.

### Arquivos para ler agora

| Arquivo | Por que ler |
|---------|-------------|
| `frontend/src/styles.css` | Fonte da verdade de cores e classes utilitárias |
| `frontend/src/components/app-shell.tsx` | Layout principal completo |
| `frontend/src/components/ui/button.tsx` | Exemplo de componente base |

### Checkpoint

- Qual arquivo é a fonte da verdade do design system?
- Como aplicar glassmorphism em um card novo?
- Por que os valores HSL não têm `hsl()` em volta?
- Qual o breakpoint para ultrawide e o que muda?

---

## Módulo 11 — Segurança e Configurações

### Conceito

#### Segurança no backend

| Mecanismo | Onde | O que faz |
|-----------|------|-----------|
| Helmet | `main.ts` | Headers de segurança HTTP (CSP, XSS protection, etc.) |
| CORS | `main.ts` | Lista de origens permitidas (`ALLOWED_ORIGINS`) |
| ThrottlerGuard | `app.module.ts` | 100 req/min global; 10/min em login e signup |
| ValidationPipe | `main.ts` | Valida e sanitiza todos os bodies de entrada |
| bcrypt | `auth.controller.ts` | Hash de senhas (nunca armazenadas em claro) |
| SHA256 | `admin-api-token.controller.ts` | Hash de API tokens |
| Prisma | Todos os repositories | Queries parametrizadas (previne SQL injection) |

#### Configurações globais (SystemSetting)

O admin pode alterar logos e visibilidade de fotos sem tocar no código:

```
Chave                   → Valor
logo_expanded_light     → /uploads/logo-light.png
logo_expanded_dark      → /uploads/logo-dark.png
logo_collapsed_light    → /uploads/icon-light.png
logo_collapsed_dark     → /uploads/icon-dark.png
show_user_photos        → "true" ou "false"
```

`GET /settings/public` retorna isso sem auth. O `SettingsProvider` do frontend faz polling
a cada 60 segundos e atualiza os logos em tempo real.

### Arquivos para ler agora

| Arquivo | Por que ler |
|---------|-------------|
| `backend/src/main.ts` | Helmet + CORS + throttler + validação |
| `backend/src/infrastructure/http/controllers/settings.controller.ts` | SystemSetting CRUD |
| `frontend/src/lib/settings.tsx` | Como o frontend consome as configurações |

### Checkpoint

- O que o Helmet protege exatamente?
- Por que `ALLOWED_ORIGINS` nunca deve ser `*` em produção?
- Como o frontend sabe qual logo exibir sem o admin redeployar?
- O que é o `ValidationPipe({ whitelist: true })` e o que ele descarta?

---

## Conclusão: Você domina o projeto quando consegue...

**Backend:**
- [ ] Traçar o caminho de um `POST /auth/login` do `main.ts` até o `profileRepository`
- [ ] Adicionar um novo endpoint em um controller existente com guard e DTO
- [ ] Criar um novo model no Prisma, rodar a migração e usar no repositório
- [ ] Explicar por que o token API usa SHA256 e não o valor em claro
- [ ] Encontrar onde o XP é adicionado ao usuário e qual é o fallback se `XpRule` não existir

**Frontend:**
- [ ] Criar uma nova página protegida com rota em `App.tsx`
- [ ] Fazer uma chamada com `apiRequest`, tratar loading e exibir toast de erro
- [ ] Usar um componente shadcn existente sem criar um novo
- [ ] Explicar como o `AuthProvider` sabe que o usuário está logado após refresh da página
- [ ] Dizer qual arquivo mudar para alterar a cor primária do tema escuro

**Integração:**
- [ ] Desenhar o fluxo completo de "aluno conclui curso e gera certificado" (banco → API → UI)
- [ ] Explicar o que acontece na rede quando o usuário navega de `/cursos` para `/dashboard`
- [ ] Identificar qual dado vem do banco, qual vem do localStorage e qual é calculado no frontend

---

## Referências rápidas

| O que você quer | Onde encontrar |
|----------------|----------------|
| Schema do banco | `backend/prisma/schema.prisma` |
| Todos os endpoints | `http://localhost:3000/api/docs` (Swagger) |
| Tokens de cor | `frontend/src/styles.css` |
| Todas as rotas do frontend | `frontend/src/App.tsx` |
| Regras de XP | `backend/src/domain/entities/user.entity.ts` |
| Regras de quiz | `backend/src/infrastructure/http/controllers/quiz.controller.ts` |
| Documentação por domínio | `backend/.claude/skills/` e `frontend/.claude/skills/` |
