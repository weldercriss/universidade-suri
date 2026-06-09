# Descrição de Módulo + Observação do Curso — Frontend

> Requer do backend: campo `notes` no curso (retornado em `GET /courses/:id` e aceito em
> `POST /courses` / `PUT /courses/:id`). A descrição da aula já vem em `GET /courses/:id`
> (`lessons[].description`) — independe do backend.
> Pode ser desenvolvido em paralelo com: o backend do campo `notes`.

---

## Contexto

1. **Descrição do módulo/aula** — em [CoursePlayer.tsx:639](src/pages/CoursePlayer.tsx#L639) é
   exibido `course.description` abaixo do título da aula. Deve exibir a descrição **da aula**
   (`lessons[].description`). Se a aula não tiver descrição própria → **não mostrar nada**
   (decisão do usuário). O form admin de aula não tem campo de descrição.

2. **Observação do curso** — novo campo `notes`. Admin edita no curso; aluno vê **abaixo do
   vídeo, como uma descrição** (na aba Aulas).

---

## Roteamento

- [ ] Sem rotas novas.

## Tipos — `src/types.ts`

- [ ] Adicionar `description?: string` ao shape de `lessons[]` na interface `Course`.

## Página — `src/pages/CoursePlayer.tsx`

### Descrição da aula
- [ ] No mapeamento das aulas (≈ linha 177-187), incluir `description: l.description || ""`.
- [ ] Linha 639: trocar `{course.description}` por exibição condicional da descrição da aula:
      renderizar `<p>` **apenas se** `lesson.description` existir (sem fallback para o curso).

### Observação do curso (abaixo do vídeo)
- [ ] Carregar `notes` do `GET /courses/:id` para o estado (ex.: adicionar `notes` ao
      `courseDetails` ou novo `useState`), via `data.notes`.
- [ ] Renderizar um bloco "Material complementar" / "Observações" abaixo do vídeo na aba Aulas
      (dentro do card, após a descrição da aula / botões de navegação), **apenas se** `notes`
      não estiver vazio.
- [ ] Renderizar o texto preservando quebras de linha (`whitespace-pre-wrap`). Sem
      `dangerouslySetInnerHTML`. (Opcional: auto-linkar URLs — avaliar na implementação.)

## Página Admin — `src/pages/AdminCourses.tsx`

### Descrição da aula
- [ ] `lessonForm` (linha 23): adicionar `description: ""`.
- [ ] Diálogos de aula (criar ≈ linha 431-440 e editar ≈ linha 553-562): adicionar um
      `Textarea` "Descrição da aula".
- [ ] Payload de criar (linha 102) e editar (linha 143): incluir `description`.
- [ ] Ao abrir edição da aula (linha 376): popular `description: l.description || ""`.
- [ ] Resets do `lessonForm` (linhas 106, 147, 399, 422, 543): incluir `description: ""`.

### Observação do curso
- [ ] `courseForm` (linha 22): adicionar `notes: ""`.
- [ ] Diálogos de curso (criar e editar): adicionar `Textarea` "Observação (links
      complementares)".
- [ ] Payloads de criar (linha 119) e editar curso: incluir `notes`.
- [ ] Ao abrir edição do curso (linha 393): popular `notes: c.notes || ""`.
- [ ] Resets do `courseForm` (linhas 87, 128, 217, 450): incluir `notes: ""`.

## Componentes — `src/components/`

- [ ] Reaproveitar `Textarea` de `src/components/ui/` — sem componentes novos.

## Integração com API

- [ ] `GET /courses/:id` já é chamado no CoursePlayer; passa a ler `data.notes` e
      `lessons[].description`.
- [ ] `POST /courses` / `PUT /courses/:id` (AdminCourses) — incluir `notes` no body.
- [ ] `POST /courses/:id/lessons` / `PUT /courses/lessons/:id` — incluir `description` no body.

## UI / UX

- [ ] Bloco de observação só aparece quando há conteúdo (empty state = não renderiza).
- [ ] Ícones somente de `lucide-react` (ex.: `LinkIcon`/`FileText` para o bloco complementar).
- [ ] Toasts de sucesso/erro já existem nos submits do AdminCourses — manter.

## Design System

- [ ] Bloco de observação usando `bg-gradient-card`/`border-border` coerente com os demais
      cards do CoursePlayer; título com `text-muted-foreground` uppercase como em "Detalhes".

## Admin vs Aluno

- [ ] Admin: edita `notes` (curso) e `description` (aula) no AdminCourses.
- [ ] Aluno: vê descrição da aula + observação abaixo do vídeo (read-only).

## Responsividade

- [ ] Verificar bloco de observação e novos campos do form em 375px / 768px / 1280px.

---

## Notas

- A observação é por **curso** (não por aula) → aparece igual abaixo do vídeo em todas as aulas.
- Projetos/comentários permanecem nas abas existentes (Comunidade/Projetos); nada a mover.
- Confirmar o nome exato do label da observação com o usuário durante a implementação se
  necessário ("Observações" vs "Material complementar").
