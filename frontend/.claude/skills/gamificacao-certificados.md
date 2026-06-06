# Gamificação & Certificados — Frontend

Para lógica de backend (XP entity, endpoints, geração de código), ver `backend/.claude/skills/gamificacao-certificados.md`.

---

## Gamificação — Páginas e Componentes

### `/gamificacao` — Página do Aluno (`Gamification.tsx`)

- Carrega regras via `GET /gamification/rules` (retorna `XpRules` ativas + `GroupRules`)
- Exibe:
  - **Fontes de XP**: cards com ação, ícone, valor em XP (ex.: "Publicar post — +10 XP")
  - **Progressão de nível**: barra de progresso de 1 a 10 (10 níveis × 1000 XP)
  - **Tiers do grupo**: tabela com tier e faixa de XP mínima/máxima

### `/admin/gamificacao` — Painel Admin (`AdminGamification.tsx`)

- Lista todas as `XpRules` com edição inline de `xpValue`, `label`, `description`, `icon`
- Salva via `PUT /admin/gamification/rules/:id`
- Link direto para `/admin/grupos` para gerenciar `GroupRules`
- Exibe tiers de cada grupo com faixas de XP (read-only nesta página)

### Link de Gamificação na UI
- Sidebar desktop e mobile: link "Gamificação" com ícone `Zap` (lucide-react)
- Menu admin (Configurações): link "Gamificação" → `/admin/gamificacao`
- Atributo `data-tour="gamification-link"` para o guided tour

---

## XP Bar

- Exibida na sidebar para alunos (oculta para admins)
- Mostra XP atual + nível
- Atributo `data-tour="xp-bar"`
- Cálculo de progresso: `(xp % 1000) / 1000 * 100` para a barra do nível atual

---

## Leaderboard — `Leaderboard.tsx` (`/ranking`)

- Carrega via `GET /auth/leaderboard` com `useCachedRequest` (TTL 120s)
- Exibe ranking de alunos por XP (decrescente)
- Admins não aparecem no ranking
- Destaca o usuário logado na lista

---

## Certificados

### Página Pública — `Certificate.tsx` (`/certificado/:code`)

- Sem autenticação — acessível por qualquer pessoa com o código
- Valida via `GET /certificates/validate/:code`
- Exibe: nome do aluno, nome do curso/trilha, data de emissão, código de verificação
- Design premium com marca d'água TOTVS (`.watermark-bg`) e gradiente de marca

### Exportação

```typescript
// PDF (html2canvas + jsPDF)
const canvas = await html2canvas(certificateRef.current);
const pdf = new jsPDF('landscape');
pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height);
pdf.save('certificado.pdf');

// PNG
const link = document.createElement('a');
link.download = 'certificado.png';
link.href = canvas.toDataURL('image/png');
link.click();
```

### Compartilhamento no LinkedIn
- Botão "Compartilhar no LinkedIn" → abre URL do LinkedIn com parâmetros pré-preenchidos
- `certId` = código de verificação, `certUrl` = URL pública do certificado

### Tipos de certificado exibidos
| Tipo | Prefixo do código | Origem |
|------|------------------|--------|
| Curso (automático) | `UNISURI-` | Conclusão de 100% |
| Curso (manual) | `UNISURI-MAN-` | Emitido pelo admin |
| Trilha | `SURI-TR-` | Aprovação no exame final |

---

## Relacionado

- XP entity e endpoints backend: `backend/.claude/skills/gamificacao-certificados.md`
- Exame de trilha (gatilho): `quizzes-trilhas.md`
- Design de certificado: `design-system.md`
