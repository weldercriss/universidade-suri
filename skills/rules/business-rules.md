# Regras de Negócio — Universidade Suri

## Autenticação
- Somente e-mail + senha corporativo. Sem Google OAuth, sem SSO.
- JWT em `localStorage` com chave `suri_token`.
- Dados do usuário em `localStorage` com chave `nimbus_user`.
- Endpoint de perfil: `GET /auth/me` — retorna dados atualizados do banco.

## Cursos e Progresso
- Módulos são sequenciais (antifraude): módulo N só libera após N-1 concluído.
- Progresso rastreado em `ModuleProgress` via `enrollmentId + moduleId`.
- Conclusão de 100% (todos os módulos concluídos) → emissão automática de certificado.

## Quiz / Provas
- Máximo de 3 tentativas por padrão. Admin pode conceder tentativas extras via `QuizExtraAttempt`.
- Aprovação: ≥ 70% de acerto.
- Ao passar: aluno recebe XP da tentativa e certificado emitido automaticamente com código `SURI-AC-[6 chars HEX]`.
- Questões são embaralhadas para alunos (sem o gabarito).
- Admin importa questões via JSON: `POST /quiz/:courseId/questions/import`.

## Certificados
- Código único: `SURI-AC-[6 chars HEX]` (automático) ou `SURI-AC-MAN-[HEX]` (manual pelo admin).
- Validação pública: `GET /certificates/validate/:code` (sem autenticação).
- Endpoint do usuário: `GET /certificates/user` → `{ count, certificates[] }`.

## Comunidade
- Feed segmentado por `groupType`: VIPs veem apenas posts de VIPs, Embaixadores de Embaixadores.
- Admin vê todos os posts mas não pode publicar.
- Cada post publicado concede `+100 XP` ao autor.
- Comentários são sempre visíveis quando existem (`commentDetails.length > 0`), independente do toggle de input.
- Posts podem ter `courseId` associado para identificação no Perfil do usuário.

## Primeiro Login
- Definição: usuário sem nenhum `ModuleProgress` no banco.
- Comportamento: Dashboard não exibe "Bem-vindo de volta" nem "Continue assistindo".
- Ao fazer o primeiro progresso num módulo, `isFirstLogin` passa a ser `false`.

## Gamificação (XP e Níveis)
- XP acumulado no campo `xp` do Profile.
- Nível calculado/gerenciado pelo admin via tela de Grupos e Níveis (`/admin/grupos`).
- `GroupRule`: define faixas de XP mínimo/máximo para cada grupo + tier.
- Admin pode filtrar usuários por grupo e subgrupo na mesma tela.

## Roadmap
- Roadmaps são conteúdos curados criados pelo admin — ex: "Dev Full Stack", "Especialista Suri Shop".
- Cada roadmap contém itens com `type`: `"video"` | `"document"` | `"reference"`, título, URL e descrição opcional.
- `isActive: true` → visível para todos os usuários (VIP, Embaixador). `isActive: false` → oculto da listagem do usuário.
- Acesso sem filtro de grupo: todos os usuários autenticados veem os mesmos roadmaps ativos.
- Admin gerencia via `/admin/roadmap` — criar, editar, toggle ativo/inativo, adicionar/remover itens.
- O item "Roadmap" no nav redireciona admin para `/admin/roadmap` e usuário para `/roadmap`.
- Cascade delete: ao excluir um roadmap, todos os seus itens são removidos automaticamente.
- Endpoints: `GET /roadmaps`, `POST /roadmaps`, `PUT /roadmaps/:id`, `DELETE /roadmaps/:id`, `POST /roadmaps/:id/items`, `PUT /roadmaps/items/:itemId`, `DELETE /roadmaps/items/:itemId`.

## Admin
- `isAdmin: true` → acesso ao painel `/admin`, `/admin/cursos`, `/admin/trilhas`, `/admin/grupos`, `/admin/relatorios`, `/admin/roadmap`.
- Admin não realiza cursos, não publica posts, não tem tier.
- Admin pode editar qualquer usuário: nome, grupo, tier, XP, nível, status (ativo/inativo), empresa.
- Relatórios filtráveis por: curso, trilha, grupo, subgrupo, nível, empresa, data de cadastro.
