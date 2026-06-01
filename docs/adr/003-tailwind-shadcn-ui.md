# ADR 003 — Tailwind CSS v4 + shadcn/ui

**Data:** 2025-05-26
**Status:** Aceito

---

## Contexto

O frontend da Universidade Suri precisa de um sistema de estilização que ofereça:
- Desenvolvimento rápido de interfaces responsivas
- Componentes acessíveis (ARIA compliance)
- Customização completa do design (branding Suri)
- Consistência visual em toda a aplicação

### Opções Consideradas

| Opção | Produtividade | Customização | Acessibilidade | Bundle Size |
|---|---|---|---|---|
| CSS puro | ⚠️ Lento | ✅ Total | ❌ Manual | ✅ Mínimo |
| Material UI (MUI) | ✅ Rápido | ⚠️ Limitada | ✅ Boa | ❌ Grande |
| Tailwind + Headless UI | ✅ Rápido | ✅ Total | ⚠️ Parcial | ✅ Pequeno |
| **Tailwind + shadcn/ui** | ✅ Rápido | ✅ Total | ✅ Excelente | ✅ Pequeno |

## Decisão

Adotamos **Tailwind CSS v4** para utilitários de estilo + **shadcn/ui** (baseado em Radix UI) para componentes.

### Tailwind CSS v4

- Integração nativa com Vite via `@tailwindcss/vite`
- CSS-first configuration (sem `tailwind.config.js`)
- Breakpoints mobile-first: `sm:480px`, `md:768px`, `lg:1024px`, `xl:1280px`

### shadcn/ui

- **Não é uma dependência**: componentes são copiados para `src/components/ui/`
- Baseado em **Radix UI** (primitivos acessíveis nativamente)
- Totalmente customizável (ownership do código)
- Usa `class-variance-authority` (CVA) para variantes
- Helper `cn()` para merge condicional de classes (`clsx` + `tailwind-merge`)

### Estrutura

```
frontend/src/components/
├── ui/              # Componentes shadcn/ui (Button, Card, Dialog, etc.)
├── app-shell.tsx    # Layout da aplicação (Navbar, Sidebar)
└── shared/          # Componentes customizados do projeto
```

## Consequências

### Positivas
- **Acessibilidade nativa**: Radix UI cuida de focus management, keyboard navigation, ARIA
- **Zero lock-in**: Código fonte dos componentes está no projeto
- **Bundle pequeno**: Tree-shaking eficiente, sem CSS não utilizado
- **Design System**: CVA permite criar variantes consistentes

### Negativas
- **Curva de aprendizado**: Tailwind utility-first pode ser estranho inicialmente
- **Classes longas**: JSX pode ficar verboso com muitas classes Tailwind
- **Manutenção manual**: Updates de shadcn/ui requerem re-copiar componentes

## Referências

- Código: `frontend/src/components/ui/`
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
