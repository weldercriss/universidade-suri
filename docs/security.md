# Segurança — Universidade Suri

> Este documento consolida as práticas de segurança implementadas na plataforma.

---

## 1. Proteção de Autenticação

### Tokens JWT
- Adotamos a estratégia dupla: **Access Token** de curta duração (15 min) e **Refresh Token** (7 dias).
- O access token não é armazenado em localStorage/sessionStorage para mitigar ataques XSS (Cross-Site Scripting). Ele fica apenas na memória da aplicação React (estado).
- O refresh token é gerenciado via cookie `httpOnly`, inacessível para scripts frontend.
- *Referência: [ADR 001 - Estratégia de Armazenamento JWT](adr/001-jwt-storage-strategy.md)*

### Senhas
- Senhas são submetidas a hashing utilizando **bcrypt** com "cost factor" configurável via variável `BCRYPT_ROUNDS` (padrão 12).
- Validadores fortes são aplicados na criação (mínimo de caracteres, exigência de letras/números).

---

## 2. Proteção de Rotas e API (NestJS)

### CORS (Cross-Origin Resource Sharing)
- Em produção, o CORS deve ser estritamente configurado para aceitar requisições apenas do domínio da aplicação frontend (definido em `ALLOWED_ORIGINS`).

### Rate Limiting
- (Pendente implementação final no código) O NestJS `ThrottlerModule` deve ser usado para limitar requisições (ex: max 100 requisições a cada 15 minutos) e evitar ataques de força bruta.

### Helmet
- (Pendente implementação final no código) O middleware `helmet` deve ser usado no NestJS para definir cabeçalhos HTTP seguros (CSP, X-Frame-Options, HSTS).

### Autorização e IDOR (Insecure Direct Object Reference)
- O backend utiliza decorators `@CurrentUser()` extraídos do payload do JWT validado.
- Repositórios e controllers verificam propriedade antes de modificar ou retornar dados sensíveis (ex: verificar se o usuário é o autor do post antes de permitir deletar).

---

## 3. Segurança no Banco de Dados

### ORM e SQL Injection
- O uso do Prisma ORM como camada de abstração garante que queries sejam parametrizadas automaticamente, protegendo contra Injeção de SQL tradicional.

### Migrations
- Em produção, modificações no schema ocorrem exclusivamente via `npx prisma migrate deploy` que aplica um histórico seguro e versionado.

---

## 4. Segurança na Infraestrutura

### Nginx Reverse Proxy
O Nginx na borda adiciona camadas de proteção adicionais (configuradas em `nginx/nginx.conf`):
- Ocultação da assinatura do servidor.
- `Strict-Transport-Security` (HSTS) forçando conexões HTTPS.
- `X-Frame-Options DENY` contra Clickjacking.
- `X-Content-Type-Options nosniff` contra ataques MIME sniffing.
- `Permissions-Policy` restringindo uso de hardware não solicitado (câmera, microfone).

### Imagens Docker
- Multi-stage builds geram imagens purgeadas de dependências de desenvolvimento.
- O backend roda via usuário `appuser` (UID 1001), e **não** como `root`, seguindo o princípio do menor privilégio em containers.

---

## 5. Auditoria e Dependências

- As dependências devem ser periodicamente verificadas por vulnerabilidades usando `npm audit`.
- Em repositórios gerenciados pelo GitHub, o **Dependabot** reporta vulnerabilidades conhecidas em pacotes da stack.
