# 💼 Regras de Negócio & Fluxos de Processo

A **Universidade Suri** combina gamificação, integridade do progresso educacional e segurança
robusta num visual premium corporativo (TOTVS / Suri Blue).

> Domínios complementares têm skills dedicadas: `quizzes-trilhas.md`, `gamificacao-certificados.md`,
> `api-externa.md`, `user-groups.md`.

---

## 👥 1. Grupos e Tiers (VIP vs Embaixador)

Igualdade de aprendizado, com diferenciação estética/prestígio:

- **VIP** (`groupType: "vip"`): tiers `VIP PLUS` (inicial), `VIP GOLD`, `VIP PLATINUM`.
- **Embaixador** (`groupType: "embaixador"`): tiers `Embaixador Voice` (inicial),
  `Embaixador Elite`, `Embaixador Icon`.
- **Admin** (`isAdmin: true`): não pertence a grupo; exibe badge "ADMINISTRADOR" no lugar do tier;
  sem acesso a cursos/comunidade como aluno.

O tier é definido na criação/convite e pode ser recalculado por faixa de XP via `GroupRule`
(ver `user-groups.md`). Detalhes em `user-groups.md`.

---

## 🔐 2. Autenticação e Controle de Acesso

- **Somente e-mail + senha corporativo** (JWT via Passport, bcrypt). **Sem Google OAuth, sem SSO.**
  Token em `localStorage["suri_token"]`, usuário em `localStorage["nimbus_user"]`.
- **Rotas protegidas**: `@UseGuards(AuthGuard('jwt'))`.
- **Rotas admin**: verificam `if (!req.user.isAdmin) throw new ForbiddenException(...)` → `403`.
- **Sistemas externos**: token SHA256 (`suri_<64hex>`) em rotas `/external/*` — ver `api-externa.md`.
- **Reset de senha**: `POST /auth/forgot-password` gera `resetPasswordToken` (+ expiry) e envia
  link com `FRONTEND_URL`; `POST /auth/reset-password` consome o token.

### Segregação por grupo (Target Group)
- `Course.targetGroup` (`all`|`vip`|`embaixador`) filtra o catálogo do aluno; o backend valida a
  correspondência antes de servir as aulas (`403` se incompatível).
- O feed da comunidade é segmentado por `groupType` (VIPs só veem VIPs; Embaixadores só Embaixadores).

---

## 📈 3. Aprendizado Sequencial (Antifraude)

- Aulas (`modules`) ordenadas por `sortOrder`.
- **Conclusão sequencial**: o aluno só conclui a aula N se a aula N-1 já estiver concluída
  (verifica `module_progress`). Endpoint: `POST /enrollments/lessons/:lessonId/complete`.
- **Inscrição explícita**: `POST /enrollments/:courseId/join`. O CoursePlayer faz auto-enroll como
  fallback.
- Admins gerenciam aulas/módulos pelo Painel Admin (`AdminCourses.tsx`).
- `isFirstLogin` (sem nenhum `ModuleProgress`) controla saudação e "Continue assistindo".

---

## 🧩 4. Quizzes e Exames de Trilha (resumo)

- **Quiz de curso**: máx. **3 tentativas**, aprovação **≥70%**; admin pode conceder tentativas
  extras (`QuizExtraAttempt`).
- **Exame de trilha**: disponível após 100% dos módulos de todos os cursos da trilha; máx. 3
  tentativas, ≥70%, **+200 XP** ao passar e libera o certificado de trilha.

Detalhes completos (endpoints, import de questões, bloqueios) em `quizzes-trilhas.md`.

---

## 🏆 5. Gamificação (XP e Níveis)

- `addXp()` **retorna early se `isAdmin`** — admin nunca acumula XP.
- Level sobe a cada **1000 XP** (`level = floor(xp/1000) + 1`).
- Fontes de XP: conclusão de curso (`Course.xpReward`, default **50**), publicação na comunidade
  (**+100 XP**), passar no exame de trilha (**+200 XP**).
- Leaderboard: `GET /auth/leaderboard`. Detalhes em `gamificacao-certificados.md`.

---

## 💬 6. Comunidade Social

- Feed segmentado por `groupType`. Posts com curtidas (`PostLike`) e comentários (`PostComment`).
- Cada post publicado com sucesso = **+100 XP** ao autor.
- Admin vê todos os posts, mas **não pode publicar**.
- Endpoints: `GET /posts`, `GET /posts/mine` (+ criação/like/comentário).

---

## 🎓 7. Certificados (resumo)

- **Curso**: `UNISURI-[6 HEX]` (automático ao atingir 100%) ou `UNISURI-MAN-[6 HEX]` (emissão
  manual pelo admin, mesmo com progresso parcial).
- **Trilha**: `SURI-TR-[6 HEX]` (ao passar no exame final).
- **Validação pública**: `GET /certificates/validate/:code` e rota `/certificado/:code`.
- Exportação PDF (`html2canvas` + `jsPDF`) e PNG; compartilhamento no LinkedIn.

Detalhes em `gamificacao-certificados.md`.

---

## 🗺️ 8. Roadmap de Capacitação

Conteúdo curado pelo admin, **sem vínculo** com cursos/trilhas:
- Admin cria roadmaps (`title`, `description`, `sortOrder`) e itens com `type`
  (`video`|`document`|`reference`), `title`, `url`, `description?`. Pode ativar/desativar.
- Apenas roadmaps `isActive=true` aparecem para usuários. **Acesso universal** (sem segmentação
  por grupo). Navegação: admin → `/admin/roadmap`; demais → `/roadmap`.
- Endpoints: `GET /roadmaps`, `GET /roadmaps/:id` (+ CRUD admin de roadmaps e itens).

---

## ⚙️ 9. Configurações Globais (SystemSetting)

`key`/`value` em `system_settings`. Chaves: `logo_expanded_light/dark`,
`logo_collapsed_light/dark`, `show_user_photos`.
- Leitura pública: `GET /settings/public` (sem auth); `SettingsProvider` faz polling de 60s.
- `PATCH /settings/photo-visibility` (preferência do usuário); `POST /settings/logos` (admin).

---

## 📰 10. Changelog da Plataforma

- Arquivos JSON em `backend/data/changelog/` — um por versão
  (`{ version, date, title, changes: [{ type: "new"|"improved"|"fixed", text }] }`).
- Endpoint `GET /changelog` (sem auth). Modal na sidebar com badge "Novo"; última versão vista em
  `localStorage["suri_changelog_seen"]`.

---

## 📖 11. Documentação Swagger

- API expõe Swagger em `/api-docs` (configurado em `main.ts`, com `addBearerAuth`).
- DTOs e controllers anotados com `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`.
