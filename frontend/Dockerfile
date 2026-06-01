# ==============================================================
# Universidade Suri — Frontend Dockerfile (Multi-stage)
# ==============================================================
# Build com Node + serve com Nginx para SPA React/Vite.
# ==============================================================

# ---------- Stage 1: Builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Copia apenas arquivos de dependências primeiro (cache de layer)
COPY package*.json ./
RUN npm ci

# Copia o restante do código e gera o build
COPY . .
RUN npm run build

# ---------- Stage 2: Production (Nginx) ----------
FROM nginx:alpine AS production

# Remove configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia configuração customizada para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos estáticos do build
COPY --from=builder /app/dist /usr/share/nginx/html

# Porta padrão do Nginx
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
