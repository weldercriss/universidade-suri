# Gamificação & Certificados — Backend

---

## XP e Níveis

Lógica central em `src/domain/entities/user.entity.ts`:

```typescript
addXp(amount: number): void {
  if (this.isAdmin) return;              // admin nunca acumula XP
  this.xp += amount;
  const newLevel = Math.floor(this.xp / 1000) + 1;  // level sobe a cada 1000 XP
  if (newLevel > this.level) this.level = newLevel;
}
```

### Fontes de XP
| Ação | XP | Fonte |
|------|----|-------|
| Concluir um curso | `Course.xpReward` (default **50**) | Configurado por curso no admin |
| Publicar post | `XpRule.action='post'` (padrão **+10**, fallback 10) | `post.controller.ts` |
| Passar no exame final de trilha | `XpRule.action='trail_exam'` (padrão **+100**, fallback 100) | `trail.controller.ts` |

- Controllers lêem `XpRule` do banco com `prisma.xpRule.findFirst({ where: { action, isActive: true } })`
- Se a regra não existir ou `isActive = false`, usam o fallback hardcoded

---

## Model XpRule (`xp_rules`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | PK |
| `action` | String (unique) | Identificador da ação (`post`, `trail_exam`, …) |
| `label` | String | Nome exibido na UI |
| `description` | String? | Descrição opcional |
| `xpValue` | Int | XP concedido |
| `icon` | String? | Nome do ícone lucide |
| `isActive` | Boolean | Se `false`, fallback hardcoded é usado |
| `updatedAt` | DateTime | |

### Endpoints de Gamificação
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| `GET` | `/gamification/rules` | JWT | Retorna `XpRules` ativas + `GroupRules` |
| `PUT` | `/admin/gamification/rules/:id` | Admin | Edita `xpValue`, `label`, `description`, `icon` |

---

## GroupRule (`group_rules`)

Associa faixas de XP a tiers — usada para calcular tier de usuário automaticamente.

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `groupType` | `"vip"` \| `"embaixador"` |
| `tier` | String (ex.: `"VIP PLUS"`) |
| `minXp` | Int |
| `maxXp` | Int? (null = sem teto) |

- CRUD em `admin/groups/rules` (admin)
- Retornadas junto com `XpRules` em `GET /gamification/rules`

---

## Leaderboard

- `GET /auth/leaderboard` — ranking de usuários por XP (decrescente)
- Não inclui admins no ranking
- Frontend: `Leaderboard.tsx` com TTL de cache de 120s

---

## Certificados

### Tipos e código de verificação
| Tipo | Código | Gatilho |
|------|--------|---------|
| Curso automático | `UNISURI-[6 HEX]` | 100% de progresso na conclusão de módulo |
| Curso manual (admin) | `UNISURI-MAN-[6 HEX]` | `POST /certificates/:courseId/issue-manual/:targetUserId` |
| Trilha | `SURI-TR-[6 HEX]` | Aprovação no exame final |

### Geração do código
```typescript
// certificate.controller.ts
const code = Math.random().toString(16).substring(2, 8).toUpperCase();
// Prefixo adiciona-se na montagem: "UNISURI-" + code
```

### Endpoints (`@Controller('certificates')`)
| Método | Rota | Uso |
|--------|------|-----|
| `POST` | `/certificates/:courseId/generate` | Gera certificado do curso (exige 100%) |
| `POST` | `/certificates/:courseId/issue-manual/:targetUserId` | Emissão manual (admin) |
| `GET` | `/certificates/user` | Certificados do usuário logado |
| `GET` | `/certificates/validate/:code` | Validação pública (sem auth) |

### Regras
- Emissão automática só ocorre a 100%; se já existir, retorna o `verificationCode` existente
- Validação pública resolve tanto `UNISURI-*` (curso) quanto `SURI-TR-*` (trilha)
- Comparação case-insensitive: `code.toUpperCase()` antes de buscar

---

## Relacionado

- Grupos e tiers: `business-rules.md`
- Exame de trilha (gatilho de XP/certificado): `quizzes-trilhas.md`
- Schema das tabelas: `database.md`
