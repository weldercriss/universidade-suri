# Arquitetura do Frontend

## Estrutura de Pastas Detalhada

```
frontend/
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── totvs.svg            # logo marca d'água (.watermark-bg)
│   └── logos/               # logos da plataforma (gerenciados via SystemSetting)
├── src/
│   ├── components/
│   │   ├── ui/              # componentes base shadcn/Radix
│   │   │   ├── button.tsx, card.tsx, input.tsx, dialog.tsx
│   │   │   ├── sonner.tsx   # toast (Sonner)
│   │   │   └── ...          # demais componentes shadcn
│   │   ├── app-shell.tsx    # layout principal + sidebar retrátil
│   │   │                    # inclui: data-tour, botão HelpCircle, badge changelog
│   │   └── GuidedTour.tsx   # react-joyride estilizado com cores Suri
│   ├── hooks/
│   │   └── useCachedRequest.ts   # cache de GET com TTL (Map global de módulo)
│   ├── lib/
│   │   ├── api.ts           # apiRequest(url, options?) — injeta JWT automaticamente
│   │   ├── auth.tsx         # AuthProvider + useAuth hook
│   │   ├── theme.tsx        # ThemeProvider + useTheme hook
│   │   ├── settings.tsx     # SettingsProvider + useSettings hook (polling 60s)
│   │   ├── tour.tsx         # TourProvider + useTour hook (react-joyride)
│   │   ├── tour-steps.ts    # 8 steps do guided tour em PT-BR
│   │   └── utils.ts         # cn(), formatDate(), etc.
│   ├── pages/               # (ver tabela abaixo)
│   ├── styles.css           # tokens Tailwind v4 — FONTE DA VERDADE DO DESIGN
│   ├── App.tsx              # react-router-dom routes
│   ├── main.tsx             # entry point (providers: Auth, Theme, Settings, Tour)
│   ├── sw.js                # service worker (PWA)
│   └── registerServiceWorker.ts
├── index.html               # inicializa webchat CBM (window.cbAsyncInit)
└── vite.config.ts
```

---

## Páginas (`src/pages/`)

| Arquivo | Rota | Acesso |
|---------|------|--------|
| `Login.tsx` | `/login` | Público |
| `SignUp.tsx` | `/signup` | Público |
| `Landing.tsx` | `/` | Público |
| `Certificate.tsx` | `/certificado/:code` | Público |
| `Dashboard.tsx` | `/dashboard` | Aluno |
| `CoursesList.tsx` | `/cursos` | Aluno |
| `CoursePlayer.tsx` | `/cursos/:id` | Aluno |
| `TrailsList.tsx` | `/trilhas` | Aluno |
| `Roadmap.tsx` | `/roadmap` | Aluno |
| `Community.tsx` | `/comunidade` | Aluno |
| `Leaderboard.tsx` | `/ranking` | Aluno |
| `Profile.tsx` | `/perfil` | Aluno |
| `Settings.tsx` | `/configuracoes` | Aluno |
| `Gamification.tsx` | `/gamificacao` | Aluno |
| `AdminPanel.tsx` | `/admin` | Admin |
| `AdminCourses.tsx` | `/admin/cursos` | Admin |
| `AdminTrails.tsx` | `/admin/trilhas` | Admin |
| `AdminGroups.tsx` | `/admin/grupos` | Admin |
| `AdminReports.tsx` | `/admin/relatorios` | Admin |
| `AdminRoadmap.tsx` | `/admin/roadmap` | Admin |
| `AdminQuizzes.tsx` | `/admin/quizzes` | Admin |
| `AdminGamification.tsx` | `/admin/gamificacao` | Admin |

---

## Context Providers

Aninhados em `main.tsx` nesta ordem (de externo para interno):

1. **`ThemeProvider`** — persiste tema no `localStorage`, aplica classe `.dark` no `<html>`
2. **`AuthProvider`** — gerencia JWT, usuário logado, login/signup/logout
3. **`SettingsProvider`** — polling 60s de `GET /settings/public` (logos, show_user_photos)
4. **`TourProvider`** — estado do guided tour (react-joyride)
5. **`<App />`** — roteamento

---

## Roteamento (`App.tsx`)

- Rotas públicas: `Login`, `SignUp`, `Landing`, `Certificate`
- Rotas protegidas (requerem JWT válido): todas as demais
- Rotas admin (requerem `isAdmin: true`): `/admin/*`
- Redirecionamento automático: usuário não autenticado → `/login`

---

## `apiRequest` (`lib/api.ts`)

```typescript
apiRequest(url: string, options?: RequestInit): Promise<Response>
```

- Base URL: `import.meta.env.VITE_API_URL`
- Injeta `Authorization: Bearer <token>` automaticamente (lê `localStorage["suri_token"]`)
- `Content-Type: application/json` por padrão
- Uso padrão:
  ```typescript
  const res = await apiRequest('/cursos');
  const data = await res.json();
  ```

---

## `useCachedRequest` (`hooks/useCachedRequest.ts`)

```typescript
useCachedRequest<T>(url: string, ttlSeconds: number): { data: T | null, loading: boolean, error: Error | null }
```

- Cache em Map global de módulo (persiste entre re-renders e navegação)
- Entrada expira após `ttlSeconds` — nova requisição é feita automaticamente
- `clearApiCache()` exportada para ser chamada no logout

---

## `app-shell.tsx` — Layout Principal

- Sidebar retrátil (desktop): largura expandida / colapsada com animação
- Atributos `data-tour` nos elementos navegáveis (para react-joyride):
  `sidebar-nav`, `nav-cursos`, `nav-trilhas`, `nav-ranking`, `gamification-link`, `xp-bar`, `tour-btn`
- Botão `HelpCircle` ("?") — sidebar desktop + header mobile (oculto para admins)
- Badge de versão do changelog na sidebar (badge "Novo" quando há versões não vistas)
- XP bar exibida para alunos (não para admins)

---

## Product Tour (`lib/tour.tsx`)

- Biblioteca: `react-joyride` v3
- `TourProvider` + `useTour` hook gerenciam estado global do tour
- Auto-inicia 800ms após login se `user.isFirstLogin && !localStorage["suri_tour_completed"]`
- Não exibido para admins (`user.isAdmin`)
- Conclusão salva em `localStorage["suri_tour_completed"] = "true"`
- `startTour()` do hook reinicia o tour manualmente (botão "?")

### 8 Steps (`lib/tour-steps.ts`)
1. Boas-vindas
2. Navegação sidebar (`[data-tour="sidebar-nav"]`)
3. Cursos (`[data-tour="nav-cursos"]`)
4. Trilhas (`[data-tour="nav-trilhas"]`)
5. Ranking (`[data-tour="nav-ranking"]`)
6. Gamificação (`[data-tour="gamification-link"]`)
7. XP bar (`[data-tour="xp-bar"]`)
8. Botão "?" (`[data-tour="tour-btn"]`)

---

## PWA

- `sw.js` + `registerServiceWorker.ts` — service worker para cache offline
- `public/manifest.json` — metadados da PWA (nome, ícones, display)
