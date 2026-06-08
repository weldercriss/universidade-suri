# Plano de Deploy — VPS (Backend + PostgreSQL) + Vercel (Frontend)

## Visão Geral

```
Usuário → seudominio.com (Vercel) → Frontend React
Usuário → api.seudominio.com (VPS + Nginx + SSL) → NestJS :3000 → PostgreSQL :5432
```

**Custo estimado mensal:**
- VPS DigitalOcean Droplet Basic: ~$6/mês (1 vCPU, 1GB RAM)
- Vercel: grátis (hobby plan)
- Domínio: já adquirido
- SSL: grátis (Let's Encrypt)

---

## Parte 1 — Configurar o Domínio DNS

No painel do seu provedor de domínio, adicione os seguintes registros DNS:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | `@` | `IP_DA_VPS` | 3600 |
| A | `www` | `IP_DA_VPS` | 3600 |
| A | `api` | `IP_DA_VPS` | 3600 |
| CNAME | `app` | `cname.vercel-dns.com` | 3600 |

> Substitua `IP_DA_VPS` pelo IP público que a DigitalOcean vai te dar.
> O subdomínio `api.seudominio.com` aponta para a VPS; o `app.seudominio.com` (ou raiz) vai para a Vercel.

---

## Parte 2 — Criar a VPS na DigitalOcean

1. Acesse [digitalocean.com](https://digitalocean.com) e crie uma conta
2. Clique em **Create → Droplets**
3. Configurações recomendadas:
   - **Image**: Ubuntu 24.04 LTS
   - **Plan**: Basic → Regular → $6/mês (1 vCPU, 1GB RAM)
   - **Datacenter**: escolha a região mais próxima dos seus usuários (ex: NYC ou FRA)
   - **Authentication**: SSH Key (recomendado) ou senha
4. Clique em **Create Droplet**
5. Anote o **IP público** gerado

---

## Parte 3 — Configurar a VPS

### 3.1 Acesso inicial

```bash
ssh root@IP_DA_VPS
```

### 3.2 Criar usuário não-root (segurança)

```bash
adduser deploy
usermod -aG sudo deploy
# Copiar chave SSH para o novo usuário
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

### 3.3 Instalar Docker e Docker Compose

```bash
# Atualizar pacotes
apt update && apt upgrade -y

# Instalar dependências
apt install -y ca-certificates curl gnupg

# Adicionar repositório Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Permitir usuário deploy usar Docker sem sudo
usermod -aG docker deploy
```

### 3.4 Instalar Nginx e Certbot

```bash
apt install -y nginx certbot python3-certbot-nginx
```

---

## Parte 4 — Configurar o Projeto na VPS

### 4.1 Clonar o repositório

```bash
su - deploy
git clone https://github.com/SEU_USUARIO/universidade-suri.git /home/deploy/app
cd /home/deploy/app
```

### 4.2 Criar o arquivo `.env` do backend

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Preencha as variáveis:

```env
DATABASE_URL="postgresql://suri_user:SENHA_FORTE@db:5432/suri_db"
JWT_SECRET="uma_string_muito_longa_e_aleatoria_aqui"
NODE_ENV="production"
PORT=3000
```

> Gere uma senha forte com: `openssl rand -base64 32`

### 4.3 Criar `docker-compose.prod.yml` na raiz do projeto

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:3000"
    env_file:
      - ./backend/.env
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: suri_user
      POSTGRES_PASSWORD: SENHA_FORTE   # mesma do DATABASE_URL
      POSTGRES_DB: suri_db
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U suri_user -d suri_db"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

### 4.4 Criar `Dockerfile` do backend (se não existir)

Crie em `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
```

### 4.5 Subir os containers

```bash
cd /home/deploy/app
docker compose -f docker-compose.prod.yml up -d --build
```

### 4.6 Rodar as migrations do Prisma

```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

---

## Parte 5 — Configurar Nginx como Reverse Proxy

### 5.1 Criar o arquivo de configuração do Nginx

```bash
nano /etc/nginx/sites-available/api.seudominio.com
```

Cole o conteúdo:

```nginx
server {
    listen 80;
    server_name api.seudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.2 Ativar o site e testar configuração

```bash
ln -s /etc/nginx/sites-available/api.seudominio.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## Parte 6 — SSL com Let's Encrypt (HTTPS)

> Aguarde os DNS propagarem antes deste passo (pode levar até 24h, geralmente ~30min).

```bash
certbot --nginx -d api.seudominio.com
```

Certbot vai:
1. Validar o domínio
2. Emitir o certificado
3. Editar o Nginx automaticamente para redirecionar HTTP → HTTPS

Renovação automática já vem configurada via cron. Para testar:

```bash
certbot renew --dry-run
```

---

## Parte 7 — Configurar CORS no NestJS

No arquivo `backend/src/main.ts`, certifique-se de que o CORS está configurado corretamente:

```typescript
app.enableCors({
  origin: [
    'https://app.seudominio.com',
    'https://www.seudominio.com',
    'https://seudominio.com',
    // em dev:
    'http://localhost:5173',
  ],
  credentials: true,
});
```

Após a alteração, rebuilde o container:

```bash
docker compose -f docker-compose.prod.yml up -d --build backend
```

---

## Parte 8 — Deploy do Frontend na Vercel

### 8.1 Instalar a CLI da Vercel (opcional, pode fazer pelo painel web)

```bash
npm i -g vercel
```

### 8.2 Configurar via painel web (recomendado)

1. Acesse [vercel.com](https://vercel.com) e conecte sua conta GitHub
2. Clique em **Add New Project**
3. Importe o repositório `universidade-suri`
4. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Em **Environment Variables**, adicione:

| Variável | Valor |
|----------|-------|
| `VITE_API_URL` | `https://api.seudominio.com` |

6. Clique em **Deploy**

### 8.3 Adicionar domínio customizado na Vercel

1. Vá em **Settings → Domains**
2. Adicione `app.seudominio.com` (ou `seudominio.com`)
3. A Vercel vai mostrar o CNAME para apontar no DNS (já feito na Parte 1)

---

## Parte 9 — Verificar e Testar

```bash
# Backend respondendo
curl https://api.seudominio.com/health

# Containers rodando
docker compose -f docker-compose.prod.yml ps

# Logs do backend
docker compose -f docker-compose.prod.yml logs -f backend

# Logs do banco
docker compose -f docker-compose.prod.yml logs -f db
```

Acesse `https://app.seudominio.com` no navegador e teste o login.

---

## Parte 10 — Manutenção

### Atualizar o projeto após um novo commit

```bash
cd /home/deploy/app
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Backup do banco de dados

```bash
# Fazer dump
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U suri_user suri_db > backup_$(date +%Y%m%d).sql

# Restaurar
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U suri_user suri_db < backup_20260608.sql
```

### Automatizar backup diário (cron)

```bash
crontab -e
```

Adicione:

```
0 3 * * * cd /home/deploy/app && docker compose -f docker-compose.prod.yml exec -T db pg_dump -U suri_user suri_db > /home/deploy/backups/backup_$(date +\%Y\%m\%d).sql
```

---

## Checklist Final

- [ ] DNS configurado (A records para VPS, CNAME para Vercel)
- [ ] VPS criada e Docker instalado
- [ ] `.env` do backend preenchido com senhas fortes
- [ ] `docker-compose.prod.yml` criado na raiz
- [ ] `Dockerfile` do backend criado
- [ ] Containers rodando (`docker compose ps` mostra `healthy`)
- [ ] Migrations aplicadas (`prisma migrate deploy`)
- [ ] Nginx configurado e testado (`nginx -t`)
- [ ] SSL emitido pelo Certbot (`https://api.seudominio.com`)
- [ ] CORS do NestJS permite o domínio da Vercel
- [ ] Frontend deployado na Vercel com `VITE_API_URL` correto
- [ ] Domínio customizado configurado na Vercel
- [ ] Login funcionando no ambiente de produção
- [ ] Backup agendado via cron
