# 🧩 Quizzes & Trilhas

Cobre o sistema de avaliação por curso (quiz) e os percursos de aprendizado (trilhas) com exame
final. Models relacionados em `database.md`; regras gerais em `business-rules.md`.

---

## 📝 1. Quiz de Curso

### Modelo de dados
- **`Question`** (`questions`) — pertence a um `Course`. Campos: `text`, `options` (`Json` — array
  de alternativas), `answer` (string da alternativa correta). É **compartilhada** entre o quiz do
  curso e o exame da trilha (relaciona com `QuizAttemptAnswer` e `TrailQuizAttemptAnswer`).
- **`QuizAttempt`** (`quiz_attempts`) — `score` (float, %), `passed`, `attemptNumber`.
  Cada tentativa guarda as respostas em `QuizAttemptAnswer` (`selectedOption`, `isCorrect`).
- **`QuizExtraAttempt`** (`quiz_extra_attempts`) — tentativa extra concedida por admin
  (`grantedBy`, `used`).

### Regras
- Máximo de **3 tentativas** por aluno (+ extras concedidas pelo admin).
- Aprovação com **score ≥ 70%**.
- Admin pode **conceder tentativa extra** a um aluno específico e ver **alunos bloqueados**
  (esgotaram tentativas sem aprovação).

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
| `GET` | `/quiz/my-attempts` | Histórico do usuário |
| `POST` | `/quiz/:courseId/grant-attempt/:userId` | Concede tentativa extra (admin) |
| `GET` | `/quiz/:courseId/blocked-students` | Alunos bloqueados (admin) |

Frontend admin: `frontend/src/pages/AdminQuizzes.tsx`.

---

## 🛤️ 2. Trilhas (Trails)

### Modelo de dados
- **`Trail`** (`trails`) — `name`, `description?`, `targetGroup` (`all`|`vip`|`embaixador`),
  `sortOrder`.
- **`TrailCourse`** (`trail_courses`) — cursos que compõem a trilha (ordenados por `sortOrder`).
- **`TrailEnrollment`** (`trail_enrollments`) — inscrição do usuário na trilha.
- **`TrailQuizAttempt`** (`trail_quiz_attempts`) — tentativas do exame final (reusa `Question`
  dos cursos). Respostas em `TrailQuizAttemptAnswer`.
- **`TrailCertificate`** (`trail_certificates`) — `verificationCode` `SURI-TR-[6 HEX]`.

### Fluxo do usuário
- Página `/trilhas` com abas **"Minhas Trilhas"** (inscritas) e **"Catálogo"** (disponíveis).
- Inscrição via `POST /trails/:id/enroll`.
- **Exame final** liberado apenas após **100% de módulos concluídos em todos os cursos** da trilha.
- Aprovação **≥70%**, máximo **3 tentativas**. Passar concede **+200 XP** e emite o certificado de
  trilha (`SURI-TR-[HEX]`).

### Endpoints (`@Controller('trails')`)
| Método | Rota | Uso |
|--------|------|-----|
| `GET` | `/trails` | Lista trilhas (filtradas por grupo) |
| `GET` | `/trails/my-enrollments` | Trilhas em que o usuário está inscrito |
| `POST` | `/trails/:id/enroll` | Inscreve o usuário |
| `GET` | `/trails/:id/exam/status` | Elegibilidade, tentativas, aprovação |
| `GET` | `/trails/:id/exam/questions` | Questões do exame final |
| `POST` | `/trails/:id/exam/submit` | Submete o exame; calcula score/`passed` |
| `POST` | `/trails` | Cria trilha (admin) |
| `PUT` | `/trails/:id` | Edita trilha (admin) |
| `DELETE` | `/trails/:id` | Remove trilha (admin) |
| `POST` | `/trails/:id/courses` | Adiciona curso à trilha (admin) |
| `DELETE` | `/trails/:id/courses/:courseId` | Remove curso da trilha (admin) |

Frontend admin: `AdminTrails.tsx`; usuário: `TrailsList.tsx`.

---

## 🔗 Relacionado

- Certificados e XP: `gamificacao-certificados.md`.
- Schema das tabelas: `database.md`.
