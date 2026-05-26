# Universidade Suri

Este é o repositório principal do projeto **Universidade Suri**, uma plataforma de ensino à distância (EAD) com recursos de gamificação e uma rede social (comunidade) integrada para os alunos (Embaixadores).

O projeto é dividido em um frontend moderno (React) e uma API robusta (NestJS), ambos utilizando TypeScript.

## 🚀 Tecnologias Utilizadas

### Frontend (`/frontend`)
*   **Framework:** React 19 com Vite
*   **Linguagem:** TypeScript
*   **Estilização:** Tailwind CSS v4, `shadcn/ui` (Radix UI) para componentes acessíveis.
*   **Roteamento:** React Router (v6)
*   **Formulários & Validação:** React Hook Form + Zod
*   **Gráficos:** Recharts

### Backend (`/backend`)
*   **Framework:** NestJS (Node.js) com foco em Clean Architecture
*   **Linguagem:** TypeScript
*   **Banco de Dados:** PostgreSQL
*   **ORM:** Prisma ORM
*   **Autenticação:** JWT (JSON Web Tokens) e bcrypt para senhas.
*   **Documentação da API:** Swagger (`@nestjs/swagger`)

### Infraestrutura
*   **Docker:** O projeto inclui um arquivo `docker-compose.yml` para subir rapidamente um banco de dados PostgreSQL local na porta 5431.

## 🧩 Principais Funcionalidades (Modelos de Dados)

Baseado no schema do banco de dados, o sistema engloba:

*   **Perfis e Gamificação (`Profile`):** Usuários possuem perfis detalhados, controle de XP (experiência), Níveis e Tiers (ex: "Embaixador Voice").
*   **Cursos e Módulos (`Course`, `Module`):** Criação de cursos com módulos, carga horária e recompensa de XP.
*   **Matrículas e Progresso (`Enrollment`, `ModuleProgress`):** Rastreamento de matrículas de usuários em cursos e o progresso aula a aula.
*   **Certificados (`Certificate`):** Emissão de certificados de conclusão gerados com códigos de verificação únicos.
*   **Comunidade (`Post`, `PostLike`, `PostComment`):** Um feed social onde os usuários podem criar postagens, curtir e comentar, interagindo com outros alunos.

## 💻 Como Rodar o Projeto Localmente

### 1. Subir o Banco de Dados
Certifique-se de ter o Docker instalado e rodando. Na raiz do projeto, execute:
```bash
docker-compose up -d
```
*Isso vai iniciar um container do PostgreSQL (chamado `unisuri`) rodando na porta 5431.*

### 2. Backend
Abra um terminal e acesse a pasta do backend:
```bash
cd backend
npm install
```
Configure as variáveis de ambiente copiando o arquivo de exemplo:
```bash
cp .env.example .env
```
*(Verifique se a variável `DATABASE_URL` no `.env` aponta para `postgresql://postgres:postgres@localhost:5431/unisuri_db?schema=public`)*

Rode as migrações do banco e inicie o servidor:
```bash
npx prisma migrate dev
npm run start:dev
```
A API estará rodando (geralmente em `http://localhost:3000`).

### 3. Frontend
Em um novo terminal, acesse a pasta do frontend:
```bash
cd frontend
npm install
npm run dev
```
A aplicação abrirá no seu navegador (geralmente em `http://localhost:5173`).
