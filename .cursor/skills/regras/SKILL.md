---
name: regras
description: >
  Valida erros, executa testes e verifica rotinas da Universidade Suri contra as regras
  do projeto. Acione automaticamente quando o usuário mencionar testes, validação,
  validar erros, testar rotinas, corrigir bugs, regressão, lint, typecheck ou cobertura.
metadata:
  triggers:
    - testes
    - teste
    - validação
    - validar
    - validar erros
    - testar rotinas
    - regressão
    - cobertura
---

# Regras — Validação e Testes

Skill para **validar erros**, **executar testes** e **verificar rotinas** do monorepo Universidade Suri, alinhada à documentação oficial do projeto e ao guia de estilo visual.

## Quando usar

Aplique esta skill quando o pedido envolver qualquer um destes contextos:

- Palavras-chave: **Testes**, **Validação**, validar erros, testar rotinas, regressão, QA, lint, typecheck
- Correção de bugs após falha em CI ou em runtime
- Criação ou revisão de testes unitários/integração no backend
- Conferência de regras de negócio (progresso sequencial, certificados, tiers, permissões admin)
- Validação de UI/UX contra o design system (cores HSL, tipografia Sora, glassmorphism)

Não aplique para tarefas puramente de documentação, deploy ou refatoração estética sem pedido de validação.

---

## Documentação de referência (consultar sempre)

Antes de implementar ou alterar código, leia os arquivos relevantes em `skills/rules/`:

| Arquivo | Quando consultar |
| :--- | :--- |
| [README.md](../../../skills/rules/README.md) | Visão geral, setup, funcionalidades |
| [Style.md](../../../skills/rules/Style.md) | **Obrigatório** para qualquer mudança de UI/CSS/componentes |
| [architecture.md](../../../skills/rules/architecture.md) | Estrutura frontend/backend, Clean Architecture, pastas |
| [business-rules.md](../../../skills/rules/business-rules.md) | Regras de negócio a cobrir nos testes e validações |
| [database.md](../../../skills/rules/database.md) | Modelagem Prisma, relacionamentos, constraints |
| [design-system.md](../../../skills/rules/design-system.md) | Tokens, componentes Radix/Shadcn, temas |

Carregue apenas os arquivos necessários à tarefa atual (progressive disclosure), mas **nunca** pule `Style.md` se a validação tocar interface.

---

## Princípios obrigatórios

### 1. Seguir rigorosamente o Style.md

- Cores em **HSL** via variáveis CSS (`--background`, `--primary`, etc.); temas Snow Blue e Night Blue
- Tipografia **Sora**; escala `html` em 13.5px (15px em telas ≥1536px)
- Padrões visuais: `.glass-panel`, `.glass-card`, ícones **lucide-react**
- Layouts: `app-container-simple`, `app-container`, `suri-topbar-solid`
- Não introduzir paletas, fontes ou ícones fora do guia sem justificativa explícita ao usuário

### 2. Evitar redundância

- **Reutilize** utilitários e mocks existentes; não duplique helpers
- Backend — factories e mocks: `backend/test/helpers/mocks.ts` (`makeUser`, `makeAdmin`, `makeCourse`, `makeLesson`, `buildUserRepoMock`, `buildJwtServiceMock`, etc.)
- Frontend — utilitários existentes: `frontend/src/lib/error-capture.ts`, `error-page.ts`, `api.ts`, `utils.ts`
- Antes de criar função nova, busque no repositório (`Grep`/`Glob`) implementação equivalente
- Testes novos devem espelhar o padrão dos specs em `backend/test/http/*.spec.ts` e `backend/test/domain/*.spec.ts` (describe aninhados, mensagens em português quando o spec vizinho já usa)

### 3. Respeitar a arquitetura

- Backend: regras no **domínio/aplicação**; controllers finos; não testar Prisma direto em testes unitários de controller — mockar repositórios
- Frontend: páginas em `pages/`, UI reutilizável em `components/ui/`
- Validações de negócio críticas (admin `403`, `targetGroup`, progresso sequencial, certificado `SURI-AC-*`) devem estar cobertas ou verificadas conforme `business-rules.md`

---

## Fluxo de execução

### Fase 1 — Entender o escopo

1. Identifique se o pedido é **backend**, **frontend** ou **ambos**
2. Leia os arquivos de `skills/rules/` listados acima conforme o escopo
3. Localize código e testes existentes relacionados (não reimplemente do zero)

### Fase 2 — Validar erros

1. Reproduza ou analise a falha (stack trace, resposta HTTP, lint, TypeScript)
2. Classifique: **regressão de negócio**, **bug técnico**, **desvio de estilo** ou **dado/schema**
3. Corrija na camada correta (domínio > aplicação > infra > UI)
4. Confirme que a correção não viola `business-rules.md` nem `Style.md`

### Fase 3 — Executar testes e rotinas

Execute na pasta correta e reporte resultado ao usuário:

**Backend** (`cd backend`):

```bash
npm run typecheck    # TypeScript sem emit
npm run lint         # ESLint
npm test             # Jest — testes unitários (padrão)
npm run test:coverage  # Cobertura, quando solicitado
npm run test:integration  # Se o pedido envolver integração
npm run test:e2e     # Se o pedido envolver e2e
```

**Frontend** (`cd frontend`):

```bash
npm run lint
npm run build        # tsc + vite build — valida tipos e compilação
```

Não invente scripts de teste no frontend: o projeto não possui suite Jest/Vitest configurada; use `build` e `lint` para validação estática.

### Fase 4 — Testar rotinas de negócio

Checklist mínimo quando o usuário pedir validação de fluxos:

- [ ] Login: credenciais inválidas → `401`; conta inativa → bloqueio
- [ ] Admin: rotas protegidas exigem `isAdmin`; não-admin → `403`
- [ ] Cursos: `targetGroup` respeitado (`vip` / `embaixador` / `all`)
- [ ] Progresso: aula N bloqueada até conclusão de N-1 (`module_progress`)
- [ ] Certificado: emissão automática em 100%; código validável em `/certificates/validate/:code`
- [ ] Comunidade: feeds segregados por `group`; XP de projeto (+100) quando aplicável

Priorize **adicionar ou ajustar testes** em `backend/test/` para regressões de API; use mocks de `helpers/mocks.ts`.

### Fase 5 — Entregar resultado

Ao concluir, informe de forma objetiva:

1. **O que foi validado** (arquivos, endpoints, telas)
2. **Comandos executados** e status (passou/falhou)
3. **Alterações feitas** (se houver) e referência à regra do guia atendida
4. **Lacunas** (ex.: sem teste e2e para fluxo X) — sem expandir escopo além do pedido

---

## Restrições

- Não commitar nem fazer push a menos que o usuário peça explicitamente
- Não criar helpers duplicados se já existirem em `mocks.ts` ou `lib/`
- Não alterar `skills/rules/` durante validação — são fonte da verdade, não alvo de edição
- Não desabilitar testes (`skip`, `xit`) para “passar” sem acordo do usuário
- Em dúvida sobre regra de negócio, cite o trecho de `business-rules.md` e pergunte antes de assumir comportamento

---

## Invocação manual

Digite `/regras` no chat do Agent para forçar esta skill, mesmo sem palavras-chave na mensagem.
