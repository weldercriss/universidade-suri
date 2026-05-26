# Guia Geral do Projeto — Universidade Suri

Bem-vindo ao guia definitivo do projeto **Universidade Suri**. Este repositório foi estruturado utilizando as melhores práticas de desenvolvimento corporativo, com um ecossistema completo e moderno dividido em:

1. **Frontend (/frontend)**: SPA robusta desenvolvida com **React + Vite** (TypeScript), estilizada de forma premium com **Tailwind CSS**, componentes da **Radix UI/Shadcn**, gráficos com **Recharts** e suporte a **PWA** completo com Service Worker. Possui suporte a **temas dinâmicos** (Snow Blue e Night Blue).
2. **Backend (/backend)**: API corporativa de alta performance escrita em **NestJS (TypeScript)** sob os conceitos rígidos de **Clean Architecture** (Arquitetura Limpa), utilizando **Prisma ORM** para persistência no banco de dados **PostgreSQL** e autenticação segura via **JWT** e **Google OAuth**.

---

## 📂 Estrutura do Guia

Para compreender todos os aspectos da aplicação de forma detalhada, consulte os guias temáticos abaixo:

*   [🎨 **Design System & Estilos**](./design-system.md): Detalhamento do sistema de cores HSL, temas dinâmicos (Snow Blue e Night Blue), tipografia `'Sora'`, escala de fontes dinâmica para alta densidade e marca d'água corporativa TOTVS.
*   [🛡️ **Arquitetura & Organização**](./architecture.md): Organização do monorepo, detalhamento da Clean Architecture no NestJS (Domain, Application, Infrastructure) e a arquitetura baseada em páginas do frontend.
*   [💼 **Regras de Negócio & Processos**](./business-rules.md): Regras de acesso e distinção estética (VIP vs Embaixador), fluxo sequencial antifraude de aulas, lógica automatizada e manual de emissão de certificados, e o painel de métricas.
*   [🗄️ **Banco de Dados & Relacionamentos**](./database.md): Modelagem física das tabelas no PostgreSQL (`profiles`, `courses`, `modules`, `enrollments`, `module_progress`, `certificates`), relacionamentos ERD e políticas de acesso (RLS).

---

## 🛠️ Como Iniciar o Projeto

### Pré-requisitos
*   **Node.js**: Versão 18 ou superior.
*   **Docker**: Opcional, para executar o banco de dados PostgreSQL localmente via `docker-compose.yml`.
*   **PostgreSQL**: Banco de dados relacional (local via Docker ou nuvem via Supabase/RDS).

### 1. Configurando o Banco de Dados (Backend)
Antes de iniciar o backend, copie o arquivo de variáveis de ambiente:
```bash
cd backend
cp .env.example .env
```
Ajuste a variável `DATABASE_URL` no `.env` com a sua string de conexão PostgreSQL.

### 2. Executando o Backend NestJS
Dentro da pasta `/backend`, instale as dependências e inicie o servidor:
```bash
# Instalar dependências
npm install

# Executar as migrações do banco (Prisma)
npm run db:migrate

# Executar o seed para criar o usuário administrador padrão
npm run db:seed

# Iniciar servidor de desenvolvimento (hot reload)
npm run start:dev
```
*Usuário padrão gerado pelo seed:* `admin@suri.com` / Senha: `SuriAdmin123`.

### 3. Executando o Frontend React
Abra um novo terminal na pasta raiz do projeto e execute:
```bash
cd frontend

# Instalar dependências
npm install

# Iniciar servidor local do Vite
npm run dev
```
O frontend estará acessível em `http://localhost:5173`.

---

## 💎 Funcionalidades de Destaque

*   **Temas Personalizados**: Suporte a *Snow Blue* (claro) e *Night Blue* (escuro) salvos localmente.
*   **Segurança de Progresso**: Bloqueio de aulas sequenciais, impedindo fraudes ou saltos na trilha de aprendizado.
*   **Certificação Completa**: Geração automática de certificados digitais em PDF após 100% de conclusão, com código alfanumérico único para validação externa e compartilhamento direto no LinkedIn.
*   **Painel Administrativo**: Criação de cursos, módulos, gerenciamento de alunos, avaliação de projetos e controle analítico de métricas.
