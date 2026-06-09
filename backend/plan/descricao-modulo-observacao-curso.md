# Descrição de Módulo + Observação do Curso — Backend

> Dependências do frontend: o front precisa que o campo `notes` do curso exista no
> create/update de curso e seja retornado em `GET /courses/:id`. A descrição da aula
> (`description`) **já existe e já é persistida/retornada** — nenhuma mudança de backend.
> Pode ser desenvolvido em paralelo com: toda a parte de descrição de aula no frontend.

---

## Contexto

Dois ajustes pedidos pelo usuário:

1. **Descrição do módulo/aula** — hoje a aba "Aulas" exibe a descrição do *curso* abaixo do
   título da aula. O backend **já suporta** descrição por aula: `Lesson.description` existe na
   entidade e é gravado/retornado por `createLesson`/`updateLesson`/`mapLessonRow`. → **Sem
   mudança de backend.** Tudo será resolvido no frontend.

2. **Observação do curso** — campo **novo** (`notes`) no curso, para o admin colocar links
   complementares. Exibido abaixo do vídeo, como uma descrição. Requer mudança de schema +
   entidade + repositório + service.

---

## Banco de Dados (Prisma)

- [ ] Adicionar campo ao model `Course` em `backend/prisma/schema.prisma`:
      `notes String? @map("notes")` (opcional; logo após `coverUrl` ou `description`)
- [ ] MongoDB (connector `@db.ObjectId`) → **sem migração SQL**. Rodar `npx prisma generate`
      (e `npx prisma db push` se necessário) para atualizar o client. Campo opcional não
      quebra documentos existentes.

## DTOs e Validação

- [ ] Não há DTO tipado para curso (controller usa `body: any` e o service faz o whitelist).
      Manter o padrão — nenhum arquivo novo de DTO.

## Controller / Endpoints

- [ ] Nenhuma rota nova. `POST /courses` e `PUT /courses/:id` já recebem `body: any`.
      Apenas o service passa a ler `body.notes`.

## Repositório — `infrastructure/database/repositories/prisma-course.repository.ts`

- [ ] `create`: incluir `notes: course.notes` no `data`
- [ ] `update`: incluir `notes: course.notes` no `data`
- [ ] `mapCourseRow`: passar `row.notes` ao construtor de `Course`

## Entidade — `domain/entities/course.entity.ts`

- [ ] Adicionar `public notes: string = ''` ao construtor de `Course`, **posicionado após
      `createdAt` e antes de `lessons`** (manter `lessons` como último param com default).
      Os 2 únicos call sites (`courses.service.ts:51` e `prisma-course.repository.ts:174`)
      serão atualizados.

## Regras de Negócio — `courses/courses.service.ts`

- [ ] `create`: passar `body.notes || ''` ao `new Course(...)` (novo arg após `new Date()`)
- [ ] `update`: `course.notes = body.notes ?? course.notes`
- [ ] Sem regra de autorização nova — já protegido por `if (!user.isAdmin)`

## Gamificação / Certificados

- [ ] Não se aplica.

## Segurança

- [ ] Campo livre de texto; sanitização/links ficam por conta da renderização no frontend
      (sem `dangerouslySetInnerHTML`). Sem rate limiting novo.

## Testes

- [ ] Ajustar/criar teste do `CoursesService.create`/`update` cobrindo `notes` (se houver
      suíte existente para courses).
- [ ] Verificar `npm run typecheck` após mudança do construtor da entidade.

---

## Notas

- `listPublicPreview` não precisa expor `notes` (é só preview da landing).
- Confirmar se `npx prisma db push` é o fluxo adotado no projeto Mongo (o CLAUDE.md ainda cita
  `npm run db:migrate` do tempo Postgres). Para Mongo, campo opcional só precisa de
  `prisma generate`.
