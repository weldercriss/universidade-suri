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
| Ação | XP |
|------|----|
| Concluir um curso | `Course.xpReward` (default **50**) | o Valor é definido de acordo com o Curso, configurado dentro do curso.
| Publicar um post na comunidade | **+10** |
| Passar no exame final de uma trilha | **+100** |

- **Admin não acumula XP** (badge "ADMINISTRADOR", sem grupo).
- Tier por faixa de XP é definido pelas `GroupRule` (ver `user-groups.md`).

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
