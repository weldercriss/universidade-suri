# Guia de Deploy em Produção

Este guia detalha o processo de deploy da plataforma Universidade Suri em um ambiente de produção usando Docker e Docker Compose.

---

## 1. Pré-requisitos

Servidor (VPS) rodando Linux (Ubuntu 22.04+ recomendado) com acesso à internet e os seguintes softwares instalados:
- Docker
- Docker Compose
- Git
- Certbot (opcional, para SSL Let's Encrypt)
- Domínio configurado apontando para o IP do servidor

## 2. Preparando o Servidor

### 2.1 Clone o Repositório

```bash
git clone https://github.com/seu-usuario/universidade-suri.git
cd universidade-suri
```

### 2.2 Configuração de Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto baseado no `.env.example`:

```bash
cp backend/.env.example .env
nano .env
```

Preencha **todas** as variáveis, prestando atenção especial à segurança:

> [!CAUTION]
> - `JWT_SECRET` e `JWT_REFRESH_SECRET` **DEVEM** ter no mínimo 32 caracteres gerados aleatoriamente (ex: `openssl rand -hex 32`).
> - `DATABASE_PASSWORD` deve ser uma senha forte.
> - `NODE_ENV` deve ser `production`.

## 3. Configurando SSL (Let's Encrypt)

> [!NOTE]
> Se você for usar um proxy reverso externo (como Cloudflare) ou infraestrutura como Render/Railway que provê SSL, você pode pular esta etapa e usar o `docker-compose.prod.yml` sem a seção Nginx.

Se for configurar SSL no próprio VPS usando o Nginx incluso:

1. Instale o certbot: `sudo apt install certbot`
2. Gere o certificado (o Nginx não pode estar rodando):
   ```bash
   sudo certbot certonly --standalone -d universidadesuri.com.br
   ```
3. Edite o `nginx/nginx.conf` e atualize o domínio `universidadesuri.com.br` para o seu domínio real em todas as ocorrências.
4. Descomente a seção `nginx:` no `docker-compose.prod.yml`.

## 4. Iniciando os Serviços

### 4.1 Build e Start

Execute o build e inicie os containers em background:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

Isso fará o build otimizado multi-stage do backend (NestJS) e frontend (React+Vite+Nginx).

### 4.2 Migrations do Banco de Dados

> [!IMPORTANT]
> O Prisma requer que as migrations sejam aplicadas antes de usar o sistema. Como o build já gerou o Prisma Client, precisamos aplicar as migrations no banco de produção.

Acesse o container do backend e execute as migrations:

```bash
docker exec -it unisuri-backend-prod sh
npx prisma migrate deploy
exit
```

> [!WARNING]
> Em produção, **NUNCA** use `npx prisma migrate dev` ou `npx prisma db push`, pois isso pode causar perda de dados. Use sempre `migrate deploy`.

## 5. Atualizando a Produção (Nova Versão)

Quando houver uma nova versão no branch `main`:

```bash
cd universidade-suri
git pull origin main

# Rebuild das imagens e restart dos containers (sem downtime do DB)
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d --no-deps backend frontend

# Se houver mudanças no schema do banco, aplique as migrations:
docker exec -it unisuri-backend-prod npx prisma migrate deploy
```

## 6. Checklist Pós-Deploy

- [ ] Acessar `https://seu-dominio.com` e verificar se a interface carrega.
- [ ] Testar login/cadastro de usuário.
- [ ] Verificar endpoint de healthcheck: `https://seu-dominio.com/api/health` (se implementado)
- [ ] Verificar logs se houver erros: `docker logs unisuri-backend-prod`
- [ ] Confirmar que Swagger NÃO está exposto em `/api/docs` (deve estar oculto por causa de `NODE_ENV=production`).

## 7. Backups

Configure um cron job no VPS para fazer backup do banco de dados diariamente:

```bash
0 3 * * * docker exec unisuri-db-prod mongodump --uri="mongodb://localhost:27017/unisuri_db" --archive=/caminho/backup/unisuri_db_$(date +\%F).archive
```
