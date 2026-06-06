# Quizzes & Trilhas — Frontend

Cobre as páginas e fluxos de UI para avaliações por curso (quiz) e percursos de aprendizado (trilhas).
Para endpoints e models do backend, ver `backend/.claude/skills/quizzes-trilhas.md`.

---

## Quiz de Curso

### Página Admin — `AdminQuizzes.tsx` (`/admin/quizzes`)

- Lista todos os cursos com quantidade de questões cadastradas
- Ao selecionar um curso: exibe questões em cards editáveis
- Funcionalidades:
  - Criar questão (texto + alternativas + resposta correta)
  - Editar questão inline
  - Remover questão (com confirmação)
  - Importar questões em lote (upload JSON)
  - Ver alunos bloqueados (esgotaram tentativas sem aprovar)
  - Conceder tentativa extra a um aluno específico

### Fluxo do Aluno (dentro do `CoursePlayer.tsx`)

1. Botão "Fazer Quiz" aparece após concluir todos os módulos do curso
2. Exibe questões uma a uma (ou em lista) com alternativas
3. Submete resposta → `POST /quiz/:courseId/submit`
4. Exibe resultado: score, `passed`, tentativas restantes
5. Se aprovado: botão "Gerar Certificado" → `POST /certificates/:courseId/generate`
6. Se reprovado e tentativas esgotadas: exibe mensagem de bloqueio

### Estado de tentativas (`GET /quiz/:courseId/status`)
```typescript
{
  attemptCount: number,     // tentativas já usadas
  maxAttempts: number,      // total permitido (3 + extras)
  passed: boolean,          // se já aprovado
  extraAttempts: number,    // tentativas extras concedidas pelo admin
}
```

---

## Trilhas

### Página do Aluno — `TrailsList.tsx` (`/trilhas`)

- **Aba "Minhas Trilhas"**: trilhas em que o usuário está inscrito
  - Exibe progresso geral (módulos concluídos / total)
  - Botão "Fazer Exame Final" (aparece quando progresso = 100% em todos os cursos)
- **Aba "Catálogo"**: trilhas disponíveis filtradas por `targetGroup`
  - Botão "Inscrever-se" → `POST /trails/:id/enroll`

### Exame Final de Trilha — fluxo UI

1. `GET /trails/:id/exam/status` — verifica elegibilidade e tentativas
2. Se elegível: botão "Iniciar Exame" exibe questões (`GET /trails/:id/exam/questions`)
3. Aluno responde e submete → `POST /trails/:id/exam/submit`
4. Resultado:
   - **Aprovado (≥70%)**: exibe `TrailCertificate` com código `SURI-TR-[HEX]`, botão de download
   - **Reprovado**: exibe score e tentativas restantes
   - **Tentativas esgotadas**: mensagem de bloqueio sem botão de reinício

### Status do exame (`GET /trails/:id/exam/status`)
```typescript
{
  eligible: boolean,        // 100% de módulos concluídos em todos os cursos
  attemptCount: number,     // tentativas já usadas (máx 3)
  passed: boolean,          // se já aprovado
  certificateCode?: string, // código do TrailCertificate se aprovado
}
```

### Página Admin — `AdminTrails.tsx` (`/admin/trilhas`)

- CRUD de trilhas (nome, descrição, targetGroup, sortOrder)
- Associar / desassociar cursos à trilha (com sortOrder)
- Visualizar inscrições e status dos alunos

---

## Relacionado

- Certificados gerados ao passar: `gamificacao-certificados.md`
- Endpoints e models: `backend/.claude/skills/quizzes-trilhas.md`
