# Refatoração — Separação de Responsabilidades por Feature Module (Frontend)

**Sem mudanças no frontend.**

A refatoração é interna ao backend (organização de controllers/services/modules em
`backend/src/<feature>/`). A **API pública permanece idêntica**: mesmas rotas, mesmos
payloads, mesmos status de erro e mesmos guards. Portanto nenhuma página, componente,
chamada `apiRequest` ou contrato consumido pelo frontend precisa ser alterado.

Checklist backend completo em `backend/plan/refatoracao-feature-modules.md`.
