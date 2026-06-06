# Autenticação & Segurança — Backend

---

## JWT (Usuários da Plataforma)

- **Estratégia**: `infrastructure/http/strategies/jwt.strategy.ts` (passport-jwt)
- **Segredo**: `JWT_SECRET` no `.env` (mínimo 32 caracteres)
- **Proteção de rota**: `@UseGuards(AuthGuard('jwt'))`
- **Verificação admin**: `if (!req.user.isAdmin) throw new ForbiddenException()`
- **Payload de `req.user`**: `{ id, email, name, isAdmin, groupType, tier, xp, level, ... }`
- Token armazenado no frontend em `localStorage["suri_token"]`; payload completo em `localStorage["nimbus_user"]`

---

## API Token (Sistemas Externos)

### Modelo `ApiToken` (`api_tokens`)
```
id          cuid()
name        String
tokenHash   String (SHA256, unique)
lastUsedAt  DateTime?
expiresAt   DateTime?
isActive    Boolean (default true)
createdById UUID (FK → profiles)
createdAt   DateTime
updatedAt   DateTime
```

### Fluxo de criação
1. Admin chama `POST /admin/api-tokens` com `{ name, expiresAt? }`
2. Backend gera `rawToken = "suri_" + crypto.randomBytes(32).toString('hex')`
3. Persiste `tokenHash = SHA256(rawToken)` na tabela `api_tokens`
4. **Retorna `rawToken` apenas nesta resposta** — nunca recuperável depois

### Fluxo de validação (a cada request `/external/*`)
1. `api-token.strategy.ts` extrai o Bearer do header `Authorization`
2. Calcula `SHA256` do valor recebido
3. Busca `ApiToken` por `tokenHash` onde `isActive = true`
4. Valida `expiresAt` — rejeita se expirado
5. Atualiza `lastUsedAt = now()`

### Guard aplicado
```typescript
@UseGuards(ApiTokenGuard)
@Controller('external')
export class ExternalApiController { ... }
```

### Endpoints de gerenciamento (admin + JWT)
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/admin/api-tokens` | Lista tokens (sem valor em claro) |
| `POST` | `/admin/api-tokens` | Cria — retorna `rawToken` apenas nesta vez |
| `PATCH` | `/admin/api-tokens/:id/toggle` | Ativa / desativa (`isActive`) |
| `DELETE` | `/admin/api-tokens/:id` | Remove permanentemente |

DTO: `src/infrastructure/http/dtos/api-token.dto.ts` → `CreateApiTokenDto`

---

## Reset de Senha

```
POST /auth/forgot-password   → { email }
  salva resetPasswordToken (UUID) + resetPasswordExpiry (+1h) no Profile
  envia e-mail: ${FRONTEND_URL}/reset-password?token=<uuid>

POST /auth/reset-password    → { token, newPassword }
  valida token + expiração
  bcrypt.hash(newPassword, BCRYPT_ROUNDS) → salva em passwordHash
  apaga resetPasswordToken e resetPasswordExpiry
```

---

## Helmet

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "webchat.chatbotmaker.io"],
      frameSrc: ["'self'", "https://www.youtube.com"],
      // ...
    }
  },
  crossOriginEmbedderPolicy: false,  // necessário para iframes YouTube
}));
```

---

## CORS

```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  credentials: true,
});
```

- `ALLOWED_ORIGINS` no `.env`: lista separada por vírgula
- **Nunca usar `*` em produção**

---

## Rate Limiting (`@nestjs/throttler`)

| Escopo | Limite |
|--------|--------|
| Global (todas as rotas) | 100 req / minuto |
| `POST /auth/login` | 10 req / minuto |
| `POST /auth/signup` | 10 req / minuto |

---

## Outras Medidas

| Medida | Implementação |
|--------|--------------|
| SQL Injection | Prisma usa queries parametrizadas (impossível via ORM) |
| Body size | `app.use(json({ limit: '8mb' }))` em `main.ts` |
| Validação de entrada | `ValidationPipe({ whitelist: true, transform: true })` global |
| Hash de senha | `bcrypt` com `BCRYPT_ROUNDS=12` (configurável em `.env`) |
| `whitelist: true` | Descarta propriedades não decoradas com `@IsXxx()` nos DTOs |
| `transform: true` | Converte tipos automaticamente (string→number, string→boolean) |
