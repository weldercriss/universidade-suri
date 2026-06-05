# 👥 Grupos e Níveis — Universidade Suri

## Estrutura de Grupos

### VIP (`groupType: "vip"`)
- `"VIP PLUS"` — inicial
- `"VIP GOLD"` — intermediário
- `"VIP PLATINUM"` — avançado

### Embaixador (`groupType: "embaixador"`)
- `"Embaixador Voice"` — inicial
- `"Embaixador Elite"` — intermediário
- `"Embaixador Icon"` — avançado

O `groupType` e o `tier` ficam no model `Profile` (`tier: String`, default `"Embaixador Voice"`).
Tiers canônicos confirmados em `frontend/src/pages/AdminGroups.tsx` / `AdminReports.tsx`.

---

## Regras de Grupo (`GroupRule`)

Associam faixas de XP a um grupo/tier. Gerenciadas pelo admin em `/admin/grupos`
(endpoints `GET/POST/PUT/DELETE /admin/groups/rules`, `GET /admin/groups/distribution`).

```
id        — UUID
groupType — "vip" | "embaixador"
tier      — ex.: "VIP PLUS", "VIP GOLD", ...
minXp     — XP mínimo para o nível
maxXp     — XP máximo (null = sem teto)
createdAt / updatedAt
```

---

## Admin

- `isAdmin: true` → não pertence a grupo; exibe badge **"ADMINISTRADOR"** no lugar do tier.
- `addXp()` retorna early para admin (não acumula XP).
- Acesso: `/admin`, `/admin/cursos`, `/admin/trilhas`, `/admin/grupos`, `/admin/relatorios`,
  `/admin/roadmap`, `/admin/quizzes`. Sem acesso a cursos/comunidade como aluno.

---

## Exibição na UI

- `groupType === "vip"`: ícone `Sparkles`.
- `groupType === "embaixador"`: ícone `Shield`.
- Admin: ícone `ShieldCheck`.
- Ícones sempre de `lucide-react`.

---

## Empresa / Newsletter

- `business: String` (default `""`) — empresa do usuário, gerenciada pelo admin; usada nos
  filtros do relatório admin (`/admin/relatorios`).
- `phone: String?` e `newsletter: Boolean` também ficam no `Profile`.

---

## 🔗 Relacionado

- Gamificação e progressão de XP: `gamificacao-certificados.md`.
- Regras de acesso por grupo (Target Group, feed): `business-rules.md`.
