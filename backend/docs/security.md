# Segurança — Universidade Suri

> Práticas de segurança implementadas na plataforma.

---

## 1. Autenticação

O sistema possui **dois mecanismos de autenticação** independentes, gerenciados por estratégias Passport distintas:

### 1a. Tokens JWT (usuários da plataforma)
- Gerado via `JwtService` (Passport.js) com expiração de **7 dias**.
- Armazenado no frontend em `localStorage["suri_token"]` e dados do usuário em `localStorage["nimbus_user"]`.
- Enviado em todas as requisições autenticadas como `Authorization: Bearer <JWT>`.
- O backend valida via `JwtStrategy` (`strategies/jwt.strategy.ts`) — estratégia Passport que extrai e verifica o token.
- Aplicado em todas as rotas com `@UseGuards(AuthGuard('jwt'))`.

### 1b. Tokens de API (sistemas externos)
- Usados exclusivamente por sistemas externos para acessar `/external/*`.
- Formato: `suri_<64 hex chars>` — gerado com `crypto.randomBytes(32)`.
- **Nunca armazenados em texto claro**: apenas o hash SHA256 (`tokenHash`) é persistido na tabela `ApiToken`.
- O token em claro é retornado **somente no momento da criação** e não pode ser recuperado depois.
- Validação feita pela `ApiTokenStrategy` (`strategies/api-token.strategy.ts`, `passport-custom`):
  1. Extrai o valor do header `Authorization: Bearer <token>`
  2. Se o valor tiver 3 pontos → é JWT → rejeita com 401 (guard correto é outro)
  3. Calcula `SHA256(token)` e consulta `ApiToken.findUnique({ where: { tokenHash } })`
  4. Verifica `isActive` e `expiresAt`
  5. Atualiza `lastUsedAt` a cada uso (auditoria)
- Gerenciados via `POST/GET/PATCH/DELETE /admin/api-tokens` (requer JWT + `isAdmin`).

### Senhas
- Hashing com **bcrypt** usando `genSalt(10)` (10 rounds).
- Variável `BCRYPT_ROUNDS=12` no `.env` existe mas o código usa 10 — futuro ajuste pode alinhar.
- Reset de senha via token hexadecimal com validade de 24 horas armazenado em `Profile.resetPasswordToken`.

---

## 2. Proteção de Rotas e API

### CORS
- Configurado em `backend/src/main.ts` com lista dinâmica via `ALLOWED_ORIGINS` (env var).
- Formato: `ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5175,https://app.seudominio.com.br`
- Requisições de origens não listadas recebem erro de CORS.
- Em desenvolvimento: fallback para `localhost:5173` e `localhost:5175`.

### Helmet (HTTP Security Headers)
- Implementado em `backend/src/main.ts` via `helmet()`.
- Headers ativos: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `X-DNS-Prefetch-Control`.
- **CSP (Content Security Policy)** configurada:
  - `frameSrc`: permite `youtube.com` e `player.vimeo.com` (iframes de vídeo)
  - `imgSrc`: permite `self`, `data:`, `blob:`, `https:` (uploads e avatares)
  - `connectSrc`: permite apenas origens do `ALLOWED_ORIGINS`
- `crossOriginEmbedderPolicy: false` — necessário para iframes do YouTube no CoursePlayer.

### Rate Limiting
- Implementado via `@nestjs/throttler` registrado no `AppModule`.
- **Global**: 100 requisições por 60 segundos por IP.
- **Endpoints de auth** (`/auth/login` e `/auth/signup`): 10 requisições por 60 segundos por IP (proteção contra força bruta).

### Validação de Input (class-validator)
- `ValidationPipe({ whitelist: true, transform: true })` aplicado globalmente em `main.ts`.
- Campos não declarados nos DTOs são ignorados silenciosamente (`whitelist: true`).
- DTOs definidos em `backend/src/infrastructure/http/dtos/auth.dto.ts`:
  - `LoginDto`: valida email e senha mínima de 6 chars
  - `SignupDto`: valida nome, email, senha e campos opcionais
  - `UpdateProfileDto`: valida campos de perfil
  - `PhotoVisibilityDto`: valida boolean de visibilidade de fotos

### Autorização de Admin
- Verificação manual em cada endpoint sensível:
  ```typescript
  if (!req.user.isAdmin) throw new ForbiddenException('...');
  ```
- Não há RBAC automatizado — cada controller verifica `req.user.isAdmin` explicitamente.

### Separação de Superfície de Ataque

| Superfície | Autenticação | Endpoints |
|---|---|---|
| Usuários finais | JWT 7 dias | `/auth/*`, `/courses/*`, `/enrollments/*`, etc. |
| Administradores | JWT 7 dias + `isAdmin=true` | `/admin/*`, `/settings/*` (write) |
| Sistemas externos | Token SHA256 | `/external/*` |

Os tokens de API não podem acessar endpoints JWT e vice-versa — as estratégias Passport são exclusivas por rota.

---

## 3. Banco de Dados

### SQL Injection
- Prisma ORM usa queries parametrizadas automaticamente — SQL injection prevenido por padrão.
- Nenhuma query raw (sem `$queryRaw`) é utilizada.

### Migrations
- Desenvolvimento: `npx prisma migrate dev`
- Produção: `npx prisma migrate deploy` (nunca `db push` em produção)

---

## 4. Upload de Arquivos

- **Extensões permitidas**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.svg`
- **Limite**: 5MB por arquivo
- **Armazenamento**: `/uploads/avatars/` e `/uploads/logos/` com nomes baseados em UUID
- **Validação**: via `fileFilter` do Multer no backend — arquivos inválidos são rejeitados antes de chegar ao disco

---

## 5. Infraestrutura Docker

- Multi-stage builds geram imagens sem dependências de desenvolvimento.
- Backend roda via usuário não-root no container.
- MongoDB exposto apenas internamente na rede Docker (porta 27017 apenas para acesso local de dev).

---

## 6. Auditoria

- Verificar vulnerabilidades periodicamente: `npm audit` em `backend/` e `frontend/`.
- Dependabot (GitHub) para alertas automáticos de CVEs.
