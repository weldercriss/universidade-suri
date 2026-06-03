# Grupos e Níveis — Universidade Suri

## Estrutura de Grupos

### VIP
Subgrupos (tiers):
- `"VIP PLUS"` — nível inicial
- `"VIP GOLD"` — nível intermediário
- `"VIP PLATINUM"` — nível avançado

### Embaixador
Subgrupos (tiers):
- `"Embaixador Voice"` — nível inicial
- `"Embaixador Elite"` — nível intermediário
- `"Embaixador Icon"` — nível avançado

## Campo groupType no Banco
- `groupType: "vip"` | `"embaixador"`
- Tier armazenado no campo `tier: String` no modelo `Profile`

## Regras de Grupo (GroupRule)
As regras associam faixas de XP a grupos e subgrupos. Gerenciadas pelo admin em `/admin/grupos`.

Modelo `GroupRule`:
```
id        — UUID
groupType — "vip" | "embaixador"
tier      — ex: "VIP PLUS", "VIP GOLD", etc.
minXp     — XP mínimo para estar neste nível
maxXp     — XP máximo (null = sem teto)
```

## Admin
- Admins (`isAdmin: true`) não pertencem a grupos.
- Exibem badge "ADMINISTRADOR" no lugar do tier.
- Acesso a: `/admin`, `/admin/cursos`, `/admin/trilhas`, `/admin/grupos`, `/admin/relatorios`.

## Exibição na UI
- `groupType === "vip"`: ícone `Sparkles` (verde), cor `text-secondary`
- `groupType === "embaixador"`: ícone `Shield` (verde), cor `text-success`
- Admin: ícone `ShieldCheck` (azul), cor `text-primary`

## Empresa
- Usuários podem ter `company: String?` associado (campo gerenciado pelo admin).
- Usado nos filtros do relatório admin.
