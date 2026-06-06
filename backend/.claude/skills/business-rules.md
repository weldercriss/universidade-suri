# Regras de Negócio — Backend

Validações e fluxos de domínio aplicados na camada de API.

---

## Perfis de Usuário

| Campo | Valores / Comportamento |
|-------|------------------------|
| `groupType` | `"vip"` \| `"embaixador"` (default `"embaixador"`) |
| `tier` VIP | `"VIP PLUS"` (inicial) → `"VIP GOLD"` → `"VIP PLATINUM"` |
| `tier` Embaixador | `"Embaixador Voice"` (inicial) → `"Embaixador Elite"` → `"Embaixador Icon"` |
| `isAdmin: true` | Sem acesso a cursos/comunidade como aluno; nunca acumula XP |
| `isFirstLogin` | `true` quando `ModuleProgress` count = 0 — retornado no payload |
| `company` | Campo `business: String` (default `""`) — gerenciado pelo admin |

---

## Autenticação e Controle de Acesso

- **Somente e-mail + senha corporativo** (JWT via Passport, bcrypt). **Sem Google OAuth, sem SSO.**
- Rota protegida: `@UseGuards(AuthGuard('jwt'))`
- Rota admin: `if (!req.user.isAdmin) throw new ForbiddenException(...)` → HTTP 403
- Reset de senha: `POST /auth/forgot-password` gera `resetPasswordToken` (UUID) + `resetPasswordExpiry` (1h) e envia `${FRONTEND_URL}/reset-password?token=...`; `POST /auth/reset-password` valida, aplica bcrypt e apaga o token

---

## Segmentação por Grupo (targetGroup)

- `Course.targetGroup` e `Trail.targetGroup`: `'all'` | `'vip'` | `'embaixador'`
- Backend valida correspondência com `req.user.groupType` antes de servir aulas — HTTP 403 se incompatível
- **Feed da comunidade (`posts`)**: filtrado por `groupType` do usuário logado
  - VIPs só veem posts de outros VIPs
  - Embaixadores só veem posts de outros Embaixadores
  - Admin vê todos mas `isAdmin` bloqueia publicação (HTTP 403)

---

## Aprendizado Sequencial (Antifraude)

- Aulas (`modules`) ordenadas por `sortOrder` dentro do curso
- `POST /enrollments/lessons/:lessonId/complete`:
  1. Busca o módulo pelo `lessonId`
  2. Verifica se módulo anterior (`sortOrder - 1`) já tem `isCompleted = true` em `module_progress`
  3. Rejeita com HTTP 400 se a aula anterior não estiver concluída
- Inscrição explícita: `POST /enrollments/:courseId/join`
- Auto-enroll: CoursePlayer chama a mesma rota como fallback (idempotente — retorna matrícula existente se já inscrito)

---

## Gamificação — XP e Níveis

`addXp()` em `domain/entities/user.entity.ts`:

```typescript
addXp(amount: number): void {
  if (this.isAdmin) return;                       // admin nunca acumula XP
  this.xp += amount;
  const newLevel = Math.floor(this.xp / 1000) + 1; // level sobe a cada 1000 XP
  if (newLevel > this.level) this.level = newLevel;
}
```

### Fontes de XP
| Ação | XP | Como lido |
|------|----|-----------|
| Concluir curso | `Course.xpReward` (default **50**) | Configurado por curso no admin |
| Publicar post | `XpRule.action='post'` (padrão **+10**, fallback 10) | Lido do banco com fallback |
| Passar no exame de trilha | `XpRule.action='trail_exam'` (padrão **+100**, fallback 100) | Lido do banco com fallback |

- Se `XpRule` não existir ou `isActive = false`, controllers usam o fallback hardcoded

---

## Certificados

| Tipo | Código | Gatilho |
|------|--------|---------|
| Curso automático | `UNISURI-[6 HEX]` | 100% de progresso |
| Curso manual (admin) | `UNISURI-MAN-[6 HEX]` | Admin emite mesmo com progresso parcial |
| Trilha | `SURI-TR-[6 HEX]` | Aprovação no exame final |

- Geração em `certificate.controller.ts`: `Math.random().toString(16).substring(2, 8).toUpperCase()`
- Se já existe certificado para o mesmo (user, course), retorna o código existente
- Validação pública: `GET /certificates/validate/:code` (sem auth); comparação em `.toUpperCase()`
- Rota também resolve certificados de trilha (`SURI-TR-...`)

---

## Quiz de Curso

- Máximo de **3 tentativas** por aluno (+ extras concedidas por admin via `QuizExtraAttempt`)
- Aprovação: `score ≥ 70%`
- Admin pode conceder tentativas extras: `POST /quiz/:courseId/grant-attempt/:userId`
- Admin pode ver alunos bloqueados: `GET /quiz/:courseId/blocked-students`

---

## Exame de Trilha

- Disponível apenas após **100% de módulos concluídos em todos os cursos da trilha**
- Máximo **3 tentativas**, aprovação **≥70%**
- Ao passar: concede XP (`XpRule.action='trail_exam'`) e emite `TrailCertificate` (`SURI-TR-[HEX]`)

---

## Roadmap de Capacitação

- Apenas roadmaps `isActive = true` são retornados para usuários comuns
- Sem segmentação por `groupType` — acesso universal
- Admin pode ativar/desativar via `PUT /roadmaps/:id`

---

## Configurações Globais

- `GET /settings/public` (sem auth) retorna todos os `SystemSetting` como objeto `{ key: value }`
- `POST /settings/logos` (admin) — upload de logos (path armazenado como string)
- `PATCH /settings/photo-visibility` — usuário alterna visibilidade da própria foto

---

## Swagger

- Disponível em `/api-docs` (configurado em `main.ts` com `addBearerAuth`)
- DTOs e controllers anotados com `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`
