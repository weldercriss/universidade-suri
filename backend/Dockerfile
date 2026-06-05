# ==============================================================
# Universidade Suri — Backend Dockerfile (Multi-stage)
# ==============================================================
# Build de produção otimizado com imagem Alpine mínima
# e usuário não-root por segurança.
# ==============================================================

# ---------- Stage 1: Builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Copia apenas arquivos de dependências primeiro (cache de layer)
COPY package*.json ./
RUN npm ci

# Copia o restante do código e gera o build
COPY . .
RUN npx prisma generate
RUN npm run build

# ---------- Stage 2: Production ----------
FROM node:20-alpine AS production
WORKDIR /app

# Instala apenas dependências de produção
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copia artefatos do builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Cria usuário não-root e diretório de uploads com as permissões corretas
RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -s /bin/sh -D appuser && \
    mkdir -p /app/uploads/avatars /app/uploads/covers && \
    chown -R appuser:appgroup /app/uploads
USER appuser

# Porta padrão da API
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Comando de inicialização
CMD ["node", "dist/main"]
