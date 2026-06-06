# Regras de Negócio — Frontend

Fluxos de UI, comportamentos de estado e integrações específicas do frontend.

---

## Autenticação (localStorage)

| Chave | Conteúdo |
|-------|---------|
| `localStorage["suri_token"]` | JWT bruto para envio no header Authorization |
| `localStorage["nimbus_user"]` | Objeto JSON completo do usuário logado |

- `AuthProvider` (`lib/auth.tsx`) carrega esses valores no boot e os expõe via `useAuth()`
- Logout: limpa ambas as chaves + chama `clearApiCache()`
- `apiRequest` lê `suri_token` automaticamente — nunca passar Authorization manualmente

---

## isFirstLogin

- `user.isFirstLogin === true` quando o aluno não tem nenhum `ModuleProgress`
- No **Dashboard**: exibe saudação personalizada "Bem-vindo, [nome]!" em vez de "Continue assistindo"
- No **Product Tour**: auto-inicia o tour se `isFirstLogin && !localStorage["suri_tour_completed"]`
- Após concluir a primeira aula, `isFirstLogin` torna-se `false` (recalculado pelo backend)

---

## Product Tour (Guided Tour)

- Biblioteca: `react-joyride` v3
- Auto-inicia 800ms após login se `user.isFirstLogin && !localStorage["suri_tour_completed"]`
- **Não exibido para admins** (`user.isAdmin`)
- Conclusão: `localStorage["suri_tour_completed"] = "true"` — não reaparece
- Botão `HelpCircle` ("?") — sidebar desktop e header mobile — permite rever manualmente via `startTour()`
- **Oculto para admins**: botão "?" não aparece se `user.isAdmin`

### Elementos-alvo (`data-tour`)
| Atributo | Elemento |
|----------|---------|
| `data-tour="sidebar-nav"` | Navegação principal da sidebar |
| `data-tour="nav-cursos"` | Link de cursos |
| `data-tour="nav-trilhas"` | Link de trilhas |
| `data-tour="nav-ranking"` | Link de ranking |
| `data-tour="gamification-link"` | Link de gamificação |
| `data-tour="xp-bar"` | Barra de XP na sidebar |
| `data-tour="tour-btn"` | Botão "?" |

---

## Changelog Modal

- Acessado via badge de versão na sidebar (`app-shell.tsx`)
- Badge "Novo" exibido quando há versões mais recentes que `localStorage["suri_changelog_seen"]`
- Ao abrir o modal: `localStorage["suri_changelog_seen"] = latestVersion`
- Dados de `GET /changelog` (sem auth)
- Estrutura de cada entrada: `{ version, date, title, changes: [{ type, text }] }`
  - `type`: `"new"` | `"improved"` | `"fixed"`

---

## Webchat (ChatbotMaker)

- Widget inicializado em `index.html`:
  ```javascript
  window.cbAsyncInit = function() {
    CBM.init({ ChatbotId: "cb11077427" });
  };
  ```
- Desktop: botão flutuante nativo do CBM com `opacity: 0.45` → `1.0` no hover
- Mobile: ícone `MessageCircle` no header do `app-shell.tsx` que simula clique no launcher:
  ```javascript
  document.querySelector('.__talkjs_launcher')?.click()
  ```

---

## Inscrição em Cursos

- Botão "Inscrever-se" na `CoursesList.tsx` chama `POST /enrollments/:courseId/join`
- `CoursePlayer.tsx` faz auto-enroll como fallback ao abrir um curso não inscrito
- Após inscrição, redireciona para a primeira aula do curso

---

## Conclusão de Aulas (Sequencial)

- Aula só pode ser marcada como concluída após a anterior estar concluída
- Backend valida e retorna erro se ordem não respeitada
- Frontend: botão "Concluir aula" desabilitado se aula anterior pendente
- Ao concluir a última aula: trigger de geração de certificado (`POST /certificates/:courseId/generate`)

---

## Inscrição em Trilhas

- Página `/trilhas` com abas: **"Minhas Trilhas"** (inscritas) e **"Catálogo"** (disponíveis)
- Inscrição via `POST /trails/:id/enroll`
- Exame final desbloqueado após 100% em todos os cursos da trilha (verificado pelo backend)

---

## Certificados — Exibição e Export

- Página pública `/certificado/:code` — exibe o certificado sem autenticação
- `Certificate.tsx` valida via `GET /certificates/validate/:code`
- Exportação PDF: `html2canvas` (captura o DOM) + `jsPDF` (gera PDF)
- Exportação PNG disponível como alternativa
- Botão de compartilhamento direto no LinkedIn

---

## Comunidade (Feed)

- Feed exibe apenas posts do mesmo `groupType` do usuário
- Admin vê todos os posts mas o botão de publicar não aparece (`user.isAdmin`)
- Cada post pode ter curtidas (`PostLike`) e comentários (`PostComment`)
- `MediaType`: imagem, vídeo ou referência — renderização condicional conforme `mediaType`

---

## Configurações Globais (SettingsProvider)

- `useSettings()` retorna: `logoExpandedLight`, `logoExpandedDark`, `logoCollapsedLight`, `logoCollapsedDark`, `showUserPhotos`
- Polling automático de 60s — mudanças de logo refletem sem refresh
- `showUserPhotos` controla exibição de `profileImage` de outros usuários

---

## Gamificação — Páginas

- `/gamificacao` (alunos): visualiza fontes de XP (carregadas do banco via `GET /gamification/rules`),
  progressão de nível (10 níveis × 1000 XP), tiers por grupo
- `/admin/gamificacao` (admin): edita `xpValue` por ação inline; link para `/admin/grupos`
- Link "Gamificação" com ícone `Zap` na sidebar e no menu admin (Configurações)
