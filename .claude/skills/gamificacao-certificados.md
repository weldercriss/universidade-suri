# 🏆 Gamificação & Certificados

## 1. XP e Níveis

A lógica de XP vive em `backend/src/domain/entities/user.entity.ts` (`addXp`):

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
| Publicar um post na comunidade | `XpRule.action='post'` (padrão **+10**, fallback 10) | Configurável via admin |
| Passar no exame final de uma trilha | `XpRule.action='trail_exam'` (padrão **+100**, fallback 100) | Configurável via admin |

> Controllers (`post.controller.ts`, `trail.controller.ts`) lêem o valor de `XpRule` no banco.
> Se a regra não existir ou `isActive=false`, usam o fallback hardcoded.

- **Admin não acumula XP** (badge "ADMINISTRADOR", sem grupo).
- Tier por faixa de XP é definido pelas `GroupRule` (ver `user-groups.md`).

### XpRule (model configurável)
Model `XpRule` (`xp_rules`): `action` (unique), `label`, `description?`, `xpValue`, `icon?`, `isActive`, `updatedAt`.
Regras iniciais inseridas no banco: `post` (+10 XP), `trail_exam` (+100 XP).

### Endpoints de Gamificação
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| `GET` | `/gamification/rules` | JWT | Retorna XpRules ativas + GroupRules |
| `PUT` | `/admin/gamification/rules/:id` | Admin | Edita `xpValue`, `label`, `description`, `icon` de uma regra |

### Páginas Frontend
- `/gamificacao` — alunos visualizam fontes de XP (carregadas do banco), progressão de nível (10 níveis × 1000 XP) e tiers por grupo
- `/admin/gamificacao` — admin edita XP por ação inline; visualiza tiers com link para `/admin/grupos`
- Link "Gamificação" (ícone `Zap`) na sidebar e no menu admin em Configurações

### Leaderboard
- `GET /auth/leaderboard` — ranking por XP. No frontend: `Leaderboard.tsx`
  (TTL de cache sugerido 120s).

---

## 2. Certificados

### Tipos e formato de código
| Tipo | Código | Quando |
|------|--------|--------|
| Curso (automático) | `UNISURI-[6 HEX]` | Progresso atinge 100% |
| Curso (manual) | `UNISURI-MAN-[6 HEX]` | Admin emite (mesmo com progresso parcial) |
| Trilha | `SURI-TR-[6 HEX]` | Aprovação no exame final da trilha |

Geração (em `certificate.controller.ts`): `Math.random().toString(16).substring(2,8).toUpperCase()`.
Códigos comparados em maiúsculas na validação (`code.toUpperCase()`).

### Endpoints (`@Controller('certificates')`)
| Método | Rota | Uso |
|--------|------|-----|
| `POST` | `/certificates/:courseId/generate` | Gera certificado do curso (100%) |
| `POST` | `/certificates/:courseId/issue-manual/:targetUserId` | Emissão manual (admin) |
| `GET` | `/certificates/user` | Certificados do usuário logado |
| `GET` | `/certificates/validate/:code` | **Validação pública** (sem auth) |

- Emissão automática só ocorre a 100%; se já existir, retorna o código existente
  ("Certificado já emitido").
- Validação pública também resolve certificados de trilha (`SURI-TR-…`).
- Rota pública no frontend: `/certificado/:code` (`Certificate.tsx`).

### Exportação / Compartilhamento
- PDF via `html2canvas` + `jsPDF`; exportação **PNG** também disponível.
- Botão de compartilhamento no **LinkedIn**.

---

## 🔗 Relacionado

- Grupos/tiers e `GroupRule`: `user-groups.md`.
- Quiz e exame de trilha (gatilhos de XP/certificado): `quizzes-trilhas.md`.
- Schema: `database.md`.
