# CLAUDE.md — Universidade Suri (Monorepo)

Plataforma educacional corporativa (TOTVS / Suri). Monorepo com frontend React e backend NestJS.

A documentação detalhada está organizada por camada:

- **Backend** → `backend/.claude/CLAUDE.md` + `backend/.claude/skills/`
- **Frontend** → `frontend/.claude/CLAUDE.md` + `frontend/.claude/skills/`

---

## Skill ativo: Divisão de Tarefas

> Ler `.claude/skills/task-planning.md` antes de qualquer tarefa de implementação.

**Sempre que o usuário designar uma tarefa, funcionalidade ou melhoria:**
1. Analisar o que envolve backend (Prisma, endpoints, DTOs, regras) e frontend (páginas, componentes, integração)
2. Criar `backend/plan/<slug>.md` com checklist backend
3. Criar `frontend/plan/<slug>.md` com checklist frontend
4. Só então perguntar se pode começar a implementar — ou aguardar instrução do usuário

Formato completo dos checklists e regras de nomeação: `.claude/skills/task-planning.md`

---

## Visão Geral

| Camada | Stack | Porta |
|--------|-------|-------|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui | 5173 (dev) / 80 (prod) |
| Backend | NestJS 10 + Prisma ORM + PostgreSQL 16 | 3000 |
| Banco | PostgreSQL 16 (Docker) | 5435 |

## Comandos Rápidos

```bash
# Backend
cd backend && npm run start:dev

# Frontend
cd frontend && npm run dev
```

## Autenticação

- **Usuários**: JWT (`localStorage["suri_token"]`). Apenas e-mail + senha. Sem OAuth.
- **Sistemas externos**: token SHA256 formato `suri_<64hex>` nas rotas `/external/*`
