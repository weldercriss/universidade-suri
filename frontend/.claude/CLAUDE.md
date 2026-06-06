# CLAUDE.md — Frontend (Universidade Suri)

Guia específico do frontend React. Para o backend, ver `backend/.claude/CLAUDE.md`.

> Skills detalhadas em `skills/`: `architecture.md`, `design-system.md`, `user-groups.md`, `business-rules.md`, `quizzes-trilhas.md`, `gamificacao-certificados.md`

---

## Stack

- **Framework**: React 19 + Vite 7
- **Linguagem**: TypeScript
- **Estilo**: Tailwind CSS v4 + shadcn/ui (Radix UI)
- **Auth**: JWT em `localStorage["suri_token"]`; usuário completo em `localStorage["nimbus_user"]`
- **Ícones**: exclusivamente `lucide-react` — nunca outra biblioteca
- **Webchat**: ChatbotMaker (CBM) via `webchat.chatbotmaker.io/cbm-jssdk.js`
- **Tour Guiado**: `react-joyride` v3
- **Porta dev**: 5173

---

## Comandos

```bash
npm run dev          # servidor Vite (porta 5173)
npm run build        # build de produção
```

---

## Estrutura de Pastas

```
src/
├── components/
│   ├── ui/              # componentes base shadcn/Radix (Button, Card, Input, sonner…)
│   ├── app-shell.tsx    # layout principal + sidebar retrátil (data-tour, botão HelpCircle)
│   └── GuidedTour.tsx   # componente react-joyride estilizado com design Suri
├── hooks/
│   └── useCachedRequest.ts  # cache de requisições com TTL (Map global)
├── lib/
│   ├── api.ts           # apiRequest — injeta JWT no Authorization automaticamente
│   ├── auth.tsx         # AuthProvider (login, signup, logout, usuário logado)
│   ├── theme.tsx        # ThemeProvider (Snow Blue / Night Blue, persiste em localStorage)
│   ├── settings.tsx     # SettingsProvider (polling 60s de GET /settings/public)
│   ├── tour.tsx         # TourProvider + useTour hook (react-joyride)
│   ├── tour-steps.ts    # 8 steps do guided tour em PT-BR
│   └── utils.ts
├── pages/               # ver skills/architecture.md para lista completa de páginas
├── styles.css           # tokens de tema Tailwind v4 — FONTE DA VERDADE do design
├── App.tsx              # rotas (react-router-dom)
└── main.tsx             # entry point + providers
```

---

## Padrões de Código

- **Ícones**: sempre de `lucide-react` — nunca heroicons, react-icons, etc.
- **Loading**: `const [loading, setLoading] = useState(true)` → `finally { setLoading(false) }`
- **Erros de API**: `catch` + `toast.error(mensagem)` — **nunca `console.log` em produção**
- **API calls**: usar `apiRequest` de `@/lib/api` (injeta JWT automaticamente)
- **Componentes UI base**: `src/components/ui/` (Radix UI / shadcn) — não criar componentes base do zero
- **Cache**: `useCachedRequest<T>(url, ttlSeconds)` para leituras com TTL

---

## Auth e Estado Global

- `AuthProvider` (em `lib/auth.tsx`) envolve toda a aplicação
- Token JWT em `localStorage["suri_token"]`
- Payload do usuário em `localStorage["nimbus_user"]`
- `apiRequest` lê o token automaticamente — não passar Authorization manualmente
- No logout: `clearApiCache()` limpa o Map global de cache + remove localStorage
- `SettingsProvider` faz polling de 60s em `GET /settings/public` (logos, `show_user_photos`)

---

## Cache de Consultas

`useCachedRequest<T>(url, ttlSeconds)` em `src/hooks/useCachedRequest.ts`:
- Map global de módulo — persiste entre re-renders e navegação SPA
- `clearApiCache()` deve ser chamado no logout

| Recurso | TTL recomendado |
|---------|----------------|
| Cursos | 120s |
| Leaderboard | 120s |
| Roadmap | 30s |
| Progresso | 60s |

---

## Design System (resumo)

- Paleta **Suri Blue** — fonte da verdade: `src/styles.css` (Tailwind v4, sintaxe `@theme`)
- **Tema escuro** (Night Blue / `.dark`): `--background: 222 22% 8%`, `--primary: 237 90% 65%`
- **Tema claro** (Snow Blue / `:root`): `--background: 218 42% 91%`, `--primary: 234 85% 45%`
- Fonte: `Sora` (Google Fonts), base `14px`, ultrawide `15px`
- Mobile first — testar em **375px**, **428px**, **768px**, **1280px**
- Detalhes completos em `skills/design-system.md`

---

## Variável de Ambiente (`.env`)

```env
VITE_API_URL=http://localhost:3000
```

---

## Webchat (Balão de Suporte)

- Widget CBM inicializado em `index.html` via `window.cbAsyncInit`; `CBM.ChatbotId = "cb11077427"`
- Desktop: botão flutuante com opacidade `0.45` → `1.0` no hover
- Mobile: acionado pelo ícone `MessageCircle` no header:
  `document.querySelector('.__talkjs_launcher')?.click()`

---

## Changelog Modal

- Modal acessível via badge de versão na sidebar
- Badge "Novo" quando há versões não vistas
- Última versão vista rastreada em `localStorage["suri_changelog_seen"]`
- Dados carregados de `GET /changelog` (sem auth)
