# Skill: Divisão de Tarefas por Camada (Task Splitter)

Quando o usuário designar uma tarefa, funcionalidade ou melhoria — independentemente do tamanho —
este skill define o processo obrigatório de análise e criação de planos separados por camada.

---

## Quando aplicar

Sempre que o usuário descrever uma tarefa com qualquer das formas abaixo:
- "Crie a funcionalidade X"
- "Preciso de X"
- "Implemente X"
- "Adicione X"
- "Quero que X funcione"
- Qualquer descrição de feature nova, melhoria ou alteração que envolva código

---

## Processo obrigatório

### 1. Analisar a tarefa

Antes de qualquer código, decompor a tarefa nos seguintes domínios:

**Backend (NestJS + Prisma)**
- Schema Prisma: novos models, campos, relações, migrações?
- Endpoints REST: quais rotas criar/alterar? Métodos HTTP? Prefixo de controller?
- DTOs: validações com class-validator?
- Regras de negócio: lógica de domínio, guards, permissões admin vs aluno?
- XP / gamificação: a ação concede XP? Precisa de `XpRule`?
- Certificados / trilhas: envolve progressão, exame, certificado?
- Segurança: rota pública, JWT, ApiToken?

**Frontend (React + Vite)**
- Páginas: nova rota em `App.tsx`? Arquivo em `src/pages/`?
- Componentes: novos componentes reutilizáveis em `src/components/`?
- Integração com API: quais `apiRequest` chamar? TTL de cache?
- Estado / providers: novo context? Alteração em `AuthProvider`, `SettingsProvider`?
- UI/UX: formulários, loading states, toasts de erro/sucesso, responsividade?
- Design: respeitar Suri Blue, lucide-react, glassmorphism, mobile first?
- Admin vs aluno: a tela existe para ambos? Guards de rota?

### 2. Identificar dependências entre camadas

Registrar o que o frontend depende do backend (endpoints que precisam existir antes)
e o que pode ser desenvolvido em paralelo.

### 3. Criar os arquivos de plano

Criar **dois arquivos de checklist** com o slug da funcionalidade:

- `backend/plan/<slug>.md`
- `frontend/plan/<slug>.md`

O slug deve ser em `kebab-case` descritivo (ex.: `adicionar-campo-empresa`, `quiz-tentativa-extra`, `sistema-notificacoes`).

---

## Formato — `backend/plan/<slug>.md`

```markdown
# [Nome da Funcionalidade] — Backend

> Dependências do frontend: liste o que o front precisa que exista antes de começar
> Pode ser desenvolvido em paralelo com: liste o que é independente

---

## Banco de Dados (Prisma)

- [ ] Descrever alteração no schema.prisma (novo model, campo, relação)
- [ ] Criar migração com `npm run db:migrate`
- [ ] Atualizar seed se necessário (`npm run db:seed`)

## DTOs e Validação

- [ ] Criar/atualizar DTO em `src/infrastructure/http/dtos/`
- [ ] Decorators class-validator necessários
- [ ] Registrar no `ValidationPipe` se novo arquivo

## Controller / Endpoints

- [ ] `[MÉTODO] /rota` — descrição do que faz
- [ ] `[MÉTODO] /rota/:id` — descrição
- [ ] Definir guard: público | JWT | JWT + isAdmin | ApiTokenGuard

## Repositório

- [ ] Adicionar método à interface `I*Repository`
- [ ] Implementar em `prisma-*.repository.ts`
- [ ] Registrar no AppModule se novo repositório

## Regras de Negócio

- [ ] Lógica de domínio (entidade ou controller)
- [ ] Validações específicas (sequencial, tentativas, XP, etc.)
- [ ] Casos de erro e HTTP status codes

## Gamificação / Certificados (se aplicável)

- [ ] Conceder XP? Qual `XpRule.action`?
- [ ] Emitir certificado? Qual prefixo de código?

## Segurança

- [ ] Rate limiting necessário?
- [ ] Validação de `targetGroup`?
- [ ] Logs ou auditoria?

## Testes

- [ ] Teste unitário da regra de negócio
- [ ] Teste de integração do endpoint

---

## Notas

> Anotar edge cases, decisões de design, dúvidas a resolver
```

---

## Formato — `frontend/plan/<slug>.md`

```markdown
# [Nome da Funcionalidade] — Frontend

> Requer do backend: liste endpoints que precisam estar prontos
> Pode ser desenvolvido em paralelo com: liste o que é independente

---

## Roteamento

- [ ] Adicionar rota em `src/App.tsx`
- [ ] Definir proteção: pública | aluno | admin

## Página(s) — `src/pages/`

- [ ] Criar `NomeDaPagina.tsx`
- [ ] Estrutura base: loading state, error state, empty state
- [ ] Layout responsivo (mobile 375px → desktop 1280px)

## Componentes — `src/components/`

- [ ] Listar novos componentes reutilizáveis necessários
- [ ] Verificar se já existe algo aproveitável em `src/components/ui/`

## Integração com API

- [ ] `apiRequest('GET /rota')` — descrever uso e TTL de cache se aplicável
- [ ] `apiRequest('POST /rota', { body })` — descrever payload
- [ ] Tratar loading: `useState(true)` → `finally { setLoading(false) }`
- [ ] Tratar erros: `catch(e) { toast.error(mensagem) }`

## Estado e Providers

- [ ] Novo context necessário?
- [ ] Atualizar `AuthProvider` / `SettingsProvider`?
- [ ] Cache com `useCachedRequest`? TTL recomendado?

## UI / UX

- [ ] Formulários: campos, validação client-side, submit
- [ ] Feedback: toast de sucesso, toast de erro, confirmações
- [ ] Estados de carregamento (skeleton ou spinner)
- [ ] Estado vazio (empty state)
- [ ] Ícones: usar exclusivamente `lucide-react`

## Design System

- [ ] Usar `.bg-gradient-card` (glassmorphism) nos cards?
- [ ] Usar `.text-gradient` em títulos?
- [ ] `.hover-lift` em cards clicáveis?
- [ ] Respeitar `--primary`, `--secondary`, `--border` do tema

## Admin vs Aluno

- [ ] A funcionalidade existe para admin?
- [ ] A funcionalidade existe para aluno?
- [ ] Diferenças de UI entre os dois perfis?

## Acessibilidade / Responsividade

- [ ] Testar em 375px (mobile)
- [ ] Testar em 768px (tablet)
- [ ] Testar em 1280px (desktop)

---

## Notas

> Anotar edge cases, decisões de UX, dúvidas sobre endpoints, comportamentos esperados
```

---

## Exemplo de execução

**Usuário**: "Adicione um sistema de notificações para alertar o aluno quando ganhar XP."

**Claude**:
1. Analisa: precisa de model `Notification` no banco, endpoint `GET /notifications`, lógica de disparo nos controllers que concedem XP, página/componente de notificações no frontend, badge de contador.
2. Identifica dependência: frontend depende do endpoint `GET /notifications` pronto.
3. Cria `backend/plan/sistema-notificacoes.md` com checklist completo de backend.
4. Cria `frontend/plan/sistema-notificacoes.md` com checklist completo de frontend.
5. Apresenta resumo ao usuário com as dependências entre as camadas.

---

## Regras importantes

- **Nunca começar a codificar antes de criar os dois arquivos de plano** (salvo que o usuário peça explicitamente para pular o plano)
- Os arquivos de plano usam `[ ]` para itens pendentes e `[x]` quando concluídos — o usuário marcará conforme avança
- Se a tarefa só afeta uma camada (ex.: só frontend), criar apenas o arquivo relevante
- Nomear o slug com base na funcionalidade, não na data ou número sequencial
- Se o usuário já tiver um plano parcial em `backend/plan/` ou `frontend/plan/`, verificar antes de criar duplicata
