# Quizzes & Trilhas — Backend

Cobre o sistema de avaliação por curso (quiz) e os percursos de aprendizado (trilhas) com exame
final. Schema completo: `database.md`.

---

## Quiz de Curso

### Models
- **`Question`** (`questions`) — `courseId` (cascade), `text`, `options` (`Json` — array de alternativas),
  `answer` (string da alternativa correta). Compartilhada entre quiz de curso e exame de trilha.
- **`QuizAttempt`** (`quiz_attempts`) — `userId`, `courseId`, `score` (float, %), `passed`,
  `attemptNumber`, `createdAt`. → `QuizAttemptAnswer` (`selectedOption`, `isCorrect`).
- **`QuizExtraAttempt`** (`quiz_extra_attempts`) — `userId`, `courseId`, `grantedBy`, `used` (false), `grantedAt`.

### Regras de Negócio
- Máximo de **3 tentativas** por aluno (+ extras concedidas pelo admin)
- Aprovação com **score ≥ 70%**
- Admin pode conceder tentativa extra e ver alunos bloqueados (esgotaram tentativas sem aprovar)
- Ao submeter: calcula `score = (respostas corretas / total) * 100`, salva `passed = score >= 70`

### Endpoints (`@Controller('quiz')`)
| Método | Rota | Uso |
|--------|------|-----|
| `GET` | `/quiz/:courseId/questions` | Lista questões (admin/edição) |
| `POST` | `/quiz/:courseId/questions` | Cria questão (admin) |
| `PUT` | `/quiz/questions/:questionId` | Edita questão (admin) |
| `DELETE` | `/quiz/questions/:questionId` | Remove questão (admin) |
| `POST` | `/quiz/:courseId/questions/import` | Importa questões em lote (admin) |
| `GET` | `/quiz/:courseId/status` | Status do aluno (tentativas restantes, aprovado?) |
| `POST` | `/quiz/:courseId/submit` | Submete tentativa; calcula score e `passed` |
| `GET` | `/quiz/my-attempts` | Histórico de tentativas do usuário |
| `POST` | `/quiz/:courseId/grant-attempt/:userId` | Concede tentativa extra (admin) |
| `GET` | `/quiz/:courseId/blocked-students` | Alunos bloqueados (admin) |

Frontend admin: `frontend/src/pages/AdminQuizzes.tsx`

---

## Trilhas (Trails)

### Models
- **`Trail`** (`trails`) — `name`, `description?`, `targetGroup` (`all`|`vip`|`embaixador`), `sortOrder`.
- **`TrailCourse`** (`trail_courses`) — cursos que compõem a trilha, `sortOrder`. **`@@unique([trailId, courseId])`**.
- **`TrailEnrollment`** (`trail_enrollments`) — inscrição do usuário. **`@@unique([userId, trailId])`**.
- **`TrailQuizAttempt`** (`trail_quiz_attempts`) — tentativas do exame final (reusa `Question` dos cursos).
  Respostas em `TrailQuizAttemptAnswer`.
- **`TrailCertificate`** (`trail_certificates`) — `verificationCode` `SURI-TR-[6 HEX]`.

### Regras de Negócio
- Exame final disponível **apenas após 100% de módulos concluídos em todos os cursos da trilha**
- Verificação: `TrailEnrollment` → todos os `Course` da trilha → cada `Enrollment` → todos os
  `ModuleProgress.isCompleted = true`
- Aprovação **≥70%**, máximo **3 tentativas**
- Ao passar: concede `XpRule.action='trail_exam'` XP + emite `TrailCertificate` (`SURI-TR-[HEX]`)

### Endpoints (`@Controller('trails')`)
| Método | Rota | Uso |
|--------|------|-----|
| `GET` | `/trails` | Lista trilhas (filtradas por targetGroup) |
| `GET` | `/trails/my-enrollments` | Trilhas em que o usuário está inscrito |
| `POST` | `/trails/:id/enroll` | Inscreve o usuário |
| `GET` | `/trails/:id/exam/status` | Elegibilidade, tentativas usadas, aprovação |
| `GET` | `/trails/:id/exam/questions` | Questões do exame final |
| `POST` | `/trails/:id/exam/submit` | Submete o exame; calcula score/`passed` |
| `POST` | `/trails` | Cria trilha (admin) |
| `PUT` | `/trails/:id` | Edita trilha (admin) |
| `DELETE` | `/trails/:id` | Remove trilha (admin) |
| `POST` | `/trails/:id/courses` | Adiciona curso à trilha (admin) |
| `DELETE` | `/trails/:id/courses/:courseId` | Remove curso da trilha (admin) |

Frontend admin: `frontend/src/pages/AdminTrails.tsx`; usuário: `frontend/src/pages/TrailsList.tsx`

---

## Relacionado

- Certificados e XP gerados: `gamificacao-certificados.md`
- Schema das tabelas: `database.md`
