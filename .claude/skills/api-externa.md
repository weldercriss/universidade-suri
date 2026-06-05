# 🔌 API Externa & Tokens de Integração

Permite que sistemas externos consultem dados da plataforma de forma somente-leitura, autenticados
por **API Token** (não JWT).

---

## 🔑 1. API Tokens (`ApiToken`)

- Model `ApiToken` (`api_tokens`, PK `cuid()`): `name`, `tokenHash` (SHA256 unique), `lastUsedAt?`,
  `expiresAt?`, `isActive` (default `true`), `createdById`, timestamps.
- **Formato**: `suri_<64hex>` — gerado com `crypto.randomBytes(32).toString('hex')` em
  `admin-api-token.controller.ts`.
- **Armazenamento**: persistido como `SHA256(token)` (`crypto.createHash('sha256')`). O token em
  claro é **exibido apenas na criação** — nunca recuperável depois.
- A cada request o guard valida `isActive`, `expiresAt` e atualiza `lastUsedAt`.

### CRUD (admin) — `@Controller('admin/api-tokens')`, JWT + isAdmin
| Método | Rota | Uso |
|--------|------|-----|
| `GET` | `/admin/api-tokens` | Lista tokens (sem o valor em claro) |
| `POST` | `/admin/api-tokens` | Cria token — **retorna o valor em claro 1x** |
| `PATCH` | `/admin/api-tokens/:id/toggle` | Ativa/desativa |
| `DELETE` | `/admin/api-tokens/:id` | Remove |

DTO: `backend/src/infrastructure/http/dtos/api-token.dto.ts` (`CreateApiTokenDto`).

---

## 🛡️ 2. Autenticação das rotas `/external/*`

- Enviado como `Authorization: Bearer suri_<token>`.
- Validado em `infrastructure/http/strategies/api-token.strategy.ts` (passport-custom): extrai o
  Bearer, calcula `SHA256` e compara com `tokenHash`.
- Guard `ApiTokenGuard` aplicado no `ExternalApiController` (`@UseGuards(ApiTokenGuard)`).

---

## 📡 3. Endpoints `GET /external/*` (somente leitura, 15)

| Rota | Retorno |
|------|---------|
| `/external/stats` | Métricas agregadas da plataforma |
| `/external/leaderboard` | Ranking de XP |
| `/external/users` | Lista de usuários |
| `/external/users/:id` | Usuário por id |
| `/external/users/newsletter` | Usuários inscritos na newsletter |
| `/external/courses` | Lista de cursos |
| `/external/courses/:id` | Curso por id |
| `/external/trails` | Lista de trilhas |
| `/external/trails/:id` | Trilha por id |
| `/external/enrollments` | Matrículas |
| `/external/enrollments/user/:userId` | Matrículas de um usuário |
| `/external/enrollments/course/:courseId` | Matrículas de um curso |
| `/external/certificates` | Certificados |
| `/external/certificates/user/:userId` | Certificados de um usuário |
| `/external/certificates/validate/:code` | Validação pública por código |

---

## 🔗 Relacionado

- Autenticação de usuários (JWT) e segurança geral: `architecture.md` / `business-rules.md`.
- Schema de `ApiToken`: `database.md`.
