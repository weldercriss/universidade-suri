# 🎓 Universidade Suri

[![CI](https://github.com/usuario/universidade-suri/actions/workflows/ci.yml/badge.svg)](https://github.com/usuario/universidade-suri/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.3-E0234E.svg)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg)](https://react.dev/)

Plataforma de ensino à distância (EAD) focada em engajamento, com recursos integrados de **gamificação** e **comunidade social** para os alunos (Embaixadores).

---

## 📚 Documentação Principal

A documentação técnica detalhada encontra-se na pasta `docs/`. Recomendamos a leitura na seguinte ordem:

1. 🏛️ **[Arquitetura do Sistema](docs/architecture.md)** — Fluxo de dados, diagramas e Clean Architecture.
2. 🔒 **[Segurança](docs/security.md)** — Práticas adotadas e gestão de tokens JWT.
3. 🚀 **[Guia de Deploy](docs/deploy-guide.md)** — Como colocar o sistema em produção com Docker.
4. 🧠 **[Decisões de Arquitetura (ADRs)](docs/adr/)** — Registro do porquê certas tecnologias foram escolhidas.

---

## 🛠️ Stack Tecnológico

O projeto é um monorepo dividido em duas aplicações principais:

### Frontend (`/frontend`)
- **React 19** + **Vite 7**
- **Tailwind CSS v4** + **shadcn/ui** (Acessibilidade)
- **Zustand** (State management de auth)

### Backend (`/backend`)
- **NestJS 10** estruturado em **Clean Architecture**
- **Prisma ORM** para abstração e migrations type-safe
- **PostgreSQL 16** via Docker

---

## 💻 Como Rodar Localmente

### 1. Pré-requisitos
- Node.js v20+
- Docker e Docker Compose
- Git

### 2. Banco de Dados
Na raiz do projeto, suba o container PostgreSQL de desenvolvimento (roda na porta `5431` para não conflitar com bancos locais):
```bash
docker-compose up -d
```

### 3. Backend
```bash
cd backend
npm install
cp .env.example .env  # O DATABASE_URL já vem configurado para o docker local
npx prisma migrate dev # Cria as tabelas no banco de dados
npm run start:dev
```
A API estará em `http://localhost:3000` (e o Swagger em `/api/docs`).

### 4. Frontend
Abra um novo terminal:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
O SPA estará em `http://localhost:5175`.

---

## 🤝 Como Contribuir

Consulte nosso guia de contribuição em **[CONTRIBUTING.md](CONTRIBUTING.md)** para detalhes sobre padronização de código, regras de TypeScript estrito e workflow de Pull Requests.
