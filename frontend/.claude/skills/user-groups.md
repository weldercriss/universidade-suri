# Grupos, Tiers e Exibição na UI

---

## Estrutura de Grupos

### VIP (`groupType: "vip"`)
| Tier | Posição |
|------|---------|
| `"VIP PLUS"` | inicial |
| `"VIP GOLD"` | intermediário |
| `"VIP PLATINUM"` | avançado |

### Embaixador (`groupType: "embaixador"`)
| Tier | Posição |
|------|---------|
| `"Embaixador Voice"` | inicial |
| `"Embaixador Elite"` | intermediário |
| `"Embaixador Icon"` | avançado |

Tiers canônicos confirmados em `src/pages/AdminGroups.tsx` e `AdminReports.tsx`.

---

## Admin

- `isAdmin: true` — não pertence a grupo; exibe badge **"ADMINISTRADOR"** no lugar do tier
- Sem acesso a cursos/comunidade como aluno
- Sem acúmulo de XP, sem tour guiado, sem botão "?"
- Vê todos os posts da comunidade mas não pode publicar

---

## Exibição de Ícones (lucide-react)

| Condição | Ícone |
|----------|-------|
| `groupType === "vip"` | `Sparkles` |
| `groupType === "embaixador"` | `Shield` |
| `isAdmin === true` | `ShieldCheck` |

Todos de `lucide-react`.

---

## Badge de Tier

- Aluno: exibe `tier` do usuário (ex.: "VIP PLUS", "Embaixador Voice")
- Admin: exibe badge "ADMINISTRADOR"
- Locais de exibição: sidebar, perfil, leaderboard, cards de usuário

---

## Segmentação de Conteúdo

- **Catálogo de cursos**: filtrado por `targetGroup` (`all`|`vip`|`embaixador`) — backend valida
- **Feed da comunidade**: alunos veem apenas posts do próprio grupo
  - VIP só vê posts de VIPs
  - Embaixador só vê posts de Embaixadores
- **Trilhas**: também segmentadas por `targetGroup`

---

## XP Bar e Nível

- Exibida na sidebar para alunos (oculta para admins)
- Atributo `data-tour="xp-bar"` para o guided tour
- Cálculo do nível: `level = floor(xp / 1000) + 1`
- Tier sobe automaticamente conforme faixas de XP definidas em `GroupRule`

---

## Empresa (business)

- Campo `business: String` (default `""`) no `Profile`
- Gerenciado pelo admin em `/admin/relatorios` e `/admin` (painel)
- Usado como filtro nos relatórios administrativos

---

## Relacionado

- Regras de acesso e segmentação: `business-rules.md`
- Gamificação e XP: `gamificacao-certificados.md`
- Design tokens e ícones: `design-system.md`
