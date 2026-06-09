# Tour Visual por Tela — Frontend

> Requer do backend: **nada** (UI pura).
> Pode ser desenvolvido em paralelo com: qualquer outra tarefa.

---

## Objetivo

Hoje existe **um único tour global** focado na sidebar, disparado pelo botão `?` na
barra lateral ([app-shell.tsx:183-192](src/components/app-shell.tsx#L183-L192)) e no header
mobile ([app-shell.tsx:319-331](src/components/app-shell.tsx#L319-L331)).

Mudar para: **um tour próprio por tela**, cada tela com seu botão `?` (igual ao da
sidebar), e **remover o tour da sidebar**.

---

## Arquitetura escolhida

- Botão `?` **sensível à rota** no header do `AppShell` (desktop + mobile). Como o
  `AppShell` envolve todas as páginas, isso garante que toda tela tenha o `?` sem duplicar
  código por arquivo. O botão lê `location.pathname` → resolve o `pageId` → dispara o tour
  daquela tela.
- Registro `pageTours: Record<string, Step[]>` em `tour-steps.ts`, um conjunto de steps por
  tela, cada step apontando para `[data-tour='...']` de elementos **daquela** página.
- `TourProvider` passa a guardar os steps ativos; `startTour(pageId)` carrega os steps do
  registro.

---

## Roteamento

- [ ] Sem rotas novas.

## `src/lib/tour-steps.ts` (refatorar)

- [ ] Trocar `export const tourSteps: Step[]` por
      `export const pageTours: Record<string, Step[]>`.
- [ ] Chaves por `pageId`: `dashboard`, `cursos`, `curso-player`, `trilhas`, `roadmap`,
      `ranking`, `gamificacao`, `perfil`, `configuracoes`.
- [ ] Cada tela: 1 step `placement: "center"` de boas-vindas + 2–4 steps apontando para
      elementos-chave da tela (`data-tour`).
- [ ] Helper `pageIdFromPath(pathname: string): string | null` para o AppShell mapear rota → pageId.

## `src/lib/tour.tsx` (TourProvider)

- [ ] Estado novo: `activeSteps: Step[]`.
- [ ] `startTour(pageId: string)` → `setActiveSteps(pageTours[pageId] ?? [])` + ativar (no-op se vazio).
- [ ] Manter auto-start no 1º login **apenas no dashboard** (`pageTours.dashboard`),
      preservando o `localStorage["suri_tour_completed"]`.
- [ ] Expor `hasTour(pageId)` para o AppShell só mostrar o `?` quando a tela tiver tour.

## `src/components/GuidedTour.tsx`

- [ ] Usar `activeSteps` do contexto em vez do import estático `tourSteps`.
- [ ] Resto (estilos/locale/tema) inalterado.

## `src/components/app-shell.tsx`

- [ ] **Remover** botão `data-tour="tour-btn"` da sidebar (linhas ~183-192).
- [ ] **Remover** botão `data-tour="tour-btn"` do header mobile (linhas ~319-331).
- [ ] Adicionar botão `?` (`HelpCircle`, `variant="outline"`) no header (top bar), ao lado do
      toggle de tema — visível em desktop e mobile, só quando `hasTour(pageId)` e `!isAdmin`.
- [ ] `onClick={() => startTour(pageIdFromPath(pathname))}`.
- [ ] Manter `<GuidedTour />` e o `data-tour="xp-bar"` do header.

## `data-tour` por página (adicionar anchors)

> Steps de boas-vindas (`center`) funcionam sem anchor; os demais precisam destes alvos.

- [ ] **Dashboard** (`Dashboard.tsx`): `dash-hero`, `dash-stats`, `dash-continue`/cursos.
- [ ] **Cursos** (`CoursesList.tsx`): busca/filtro, card de curso, progresso.
- [ ] **Curso Player** (`CoursePlayer.tsx`): player de vídeo, lista de aulas, abas
      (Aulas/Comunidade/Projetos), botão concluir.
- [ ] **Trilhas** (`TrailsList.tsx`): card de trilha, exame final/certificado.
- [ ] **Roadmap** (`Roadmap.tsx`): nós do roadmap, progresso.
- [ ] **Ranking** (`Leaderboard.tsx`): pódio/lista, filtro de grupo.
- [ ] **Gamificação** (`Gamification.tsx`): tiers, regras de XP.
- [ ] **Perfil** (`Profile.tsx`): avatar/edição, certificados.
- [ ] **Configurações** (`Settings.tsx`): tema, dados da conta, senha.

## UI / UX

- [ ] Botão `?` idêntico ao padrão atual: `HelpCircle` de `lucide-react`, `title`/`aria-label`.
- [ ] Tela admin não exibe o `?` (igual hoje, `!isAdmin`).
- [ ] Se a tela atual não tiver tour cadastrado, o `?` não aparece (evita tour vazio).

## Design System

- [ ] Botão segue o mesmo `variant="outline" size="icon"` dos demais do header.
- [ ] Tooltip de tour com tema (já tratado no `GuidedTour`).

## Admin vs Aluno

- [ ] Aluno: `?` por tela + tours. Admin: sem `?` (sem mudança).

## Responsividade

- [ ] Verificar botão `?` no header em 375px / 768px / 1280px.
- [ ] Verificar overlay do joyride em mobile (scroll para o step).

---

## Notas

- `localStorage["suri_tour_completed"]` continua marcando o auto-start do 1º login (dashboard).
- Decisão: **um** `?` contextual no header (não um por componente de página) — cobre toda
  tela e mantém o código DRY.
- Conteúdo textual de cada tour pode ser refinado durante a implementação.
