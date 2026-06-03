# 🛡️ Arquitetura & Organização do Projeto

A **Universidade Suri** adota padrões arquiteturais modernos para garantir manutenibilidade, extensibilidade e desacoplamento absoluto entre a interface de usuário (frontend) e a lógica de negócios e persistência (backend). O repositório está estruturado como um monorepo dividido em duas pastas principais: `/frontend` e `/backend`.

---

## 🎨 1. Frontend: React + Vite SPA

Para simplificar o deploy e otimizar o tempo de carregamento no navegador, o frontend é uma **Single Page Application (SPA)** pura utilizando **React 19, Vite, TypeScript e Tailwind CSS**.

### 📂 Estrutura de Pastas do Frontend

```
frontend/
├── public/                  # Arquivos estáticos (manifest.json, logo.png, totvs.svg)
├── src/
│   ├── components/          # Componentes reutilizáveis de UI
│   │   ├── ui/              # Componentes de base (Button, Card, Input, etc. - Radix UI)
│   │   └── app-shell.tsx    # Layout de navegação geral com a barra lateral adaptativa
│   ├── hooks/               # Custom hooks (Ex: useAuth, useTheme)
│   ├── lib/
│   │   ├── api.ts           # Cliente Axios/Fetch centralizado com interceptores de JWT
│   │   ├── auth.tsx         # Contexto de autenticação e gerenciamento de estado do usuário
│   │   ├── theme.tsx        # Contexto do Tema dinâmico (Snow Blue e Night Blue)
│   │   ├── error-capture.ts # Utilitários para captura e log de exceções no frontend
│   │   ├── error-page.ts    # Renderizador visual amigável para falhas inesperadas
│   │   └── utils.ts         # Utilitários gerais (classes condicionais Tailwind)
│   ├── pages/               # Páginas completas da aplicação
│   │   ├── Dashboard.tsx    # Tela inicial e painel geral do aluno
│   │   ├── AdminPanel.tsx   # Painel Administrativo (usuários, quiz)
│   │   ├── AdminCourses.tsx # CRUD de cursos e aulas
│   │   ├── AdminTrails.tsx  # CRUD de trilhas
│   │   ├── AdminGroups.tsx  # Gestão de grupos e tiers
│   │   ├── AdminReports.tsx # Relatórios e analytics
│   │   ├── AdminRoadmap.tsx # CRUD de roadmaps e itens (admin)
│   │   ├── CoursesList.tsx  # Catálogo e listagem de cursos disponíveis
│   │   ├── CoursePlayer.tsx # Player sequencial de aulas com leitura de conteúdo e vídeo
│   │   ├── TrailsList.tsx   # Listagem de trilhas de aprendizado
│   │   ├── Roadmap.tsx      # Roadmaps curados (list view + detail view por área)
│   │   ├── Community.tsx    # Feed da comunidade de membros com curtidas e comentários
│   │   ├── Leaderboard.tsx  # Ranking de XP e engajamento dos membros
│   │   ├── Profile.tsx      # Perfil do usuário, conquistas, XP e nível
│   │   ├── Settings.tsx     # Configurações do sistema e preferências
│   │   ├── Login.tsx        # Página de login corporativo (e-mail + senha)
│   │   ├── SignUp.tsx       # Cadastro de novas contas (Embaixadores e VIPs)
│   │   └── Certificate.tsx  # Validador público e emissor visual de certificados
│   ├── styles.css           # Estilos globais Tailwind + Tokens de Temas (HSL)
│   ├── main.tsx             # Ponto de entrada do React
│   ├── sw.js                # Service Worker para suporte PWA (modo offline e cache)
│   └── registerServiceWorker.ts
├── index.html               # Template HTML padrão do Vite
├── vite.config.ts           # Configurações de empacotamento do Vite
└── tsconfig.json            # Configurações do TypeScript compiler
```

---

## 🛡️ 2. Backend: NestJS com Clean Architecture & Prisma

O backend é desenvolvido em **NestJS (TypeScript)**, organizado sob os princípios da **Clean Architecture** (Arquitetura Limpa). A principal meta é manter as regras de negócio cruciais e entidades do domínio totalmente independentes de frameworks de terceiros, bancos de dados físicos ou protocolos de comunicação externa. A persistência é gerenciada por meio do **Prisma ORM** integrado ao **PostgreSQL**.

### 📂 Estrutura de Pastas do Backend

```
backend/
├── prisma/
│   └── schema.prisma         # Definições das tabelas PostgreSQL, tipos e relações (Prisma)
├── src/
│   ├── domain/               # Camada de Domínio (Core - Totalmente Isolado)
│   │   ├── entities/         # Entidades de negócio (User, Course, Lesson, Certificate, Roadmap, RoadmapItem)
│   │   └── repositories/     # Interfaces de repositórios (IUserRepository, ICourseRepository, IPostRepository, IRoadmapRepository)
│   ├── application/          # Camada de Aplicação (Casos de Uso)
│   │   └── use-cases/        # Fluxos de dados que realizam regras de negócio
│   ├── infrastructure/       # Camada de Infraestrutura (Detalhes técnicos)
│   │   ├── database/         # PrismaService, sementes e repositórios concretos
│   │   ├── http/             # Controladores (REST), DTOs, Estratégias e Guards de Autenticação
│   │   └── config/           # Carregamento e validação de configurações globais
│   ├── main.ts               # Inicializador da aplicação NestJS
│   └── app.module.ts         # Módulo raiz que unifica os provedores e dependências
├── scripts/                  # Scripts DevOps e DB executados com ts-node
│   ├── backup.ts             # Backup de esquema e dados físico (.sql) usando pg_dump
│   ├── migrate.ts            # Execução controlada de scripts SQL de migração
│   ├── restore.ts            # Restauração automatizada de dumps de banco de dados
│   ├── seed-test-user.ts     # Semeador automático do usuário administrador de testes
│   └── sync.ts               # Sincronizador de esquemas de tabelas
├── package.json              # Scripts npm, dependências e configurações NestJS
└── tsconfig.json             # Configuração TypeScript do Backend
```

---

## 🛠️ 3. Scripts de Banco de Dados & DevOps

Na pasta `/backend/scripts`, há utilitários escritos em TypeScript para facilitar o gerenciamento de infraestrutura e banco de dados local ou em produção. Eles podem ser invocados diretamente via comandos `npm run`:

1.  **Migração do Banco de Dados (`npm run db:migrate`)**:
    *   Lê os arquivos de migração SQL e os executa sequencialmente de forma transacional no PostgreSQL.
    *   Mantém a paridade entre ambientes de desenvolvimento e produção.
2.  **Sincronização do Banco de Dados (`npm run db:sync`)**:
    *   Compara o estado atual das entidades Prisma com as tabelas do Postgres e detecta colunas ou chaves ausentes.
3.  **Backup do Banco de Dados (`npm run db:backup`)**:
    *   Realiza um dump completo (esquema e dados) usando `pg_dump` e salva em `backend/backups/backup-YYYY-MM-DD.sql`.
4.  **Restauração do Banco de Dados (`npm run db:restore`)**:
    *   Lê o arquivo de backup mais recente da pasta de backups e reconstrói o banco de dados via `psql`.
5.  **Criação de Administrador Padrão (`npm run db:seed`)**:
    *   Cadastra um usuário administrativo de testes com `isAdmin = true` (`admin@suri.com` / `SuriAdmin123`) para acelerar o desenvolvimento local.
