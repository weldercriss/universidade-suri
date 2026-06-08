# Implementação de MongoDB e Deploy no Azure Web App

Este plano detalha as etapas necessárias para adaptar o back-end existente (atualmente em PostgreSQL/Supabase) para usar **MongoDB** (visando posterior migração para o **Azure CosmosDB**) e como configurar o ambiente de hospedagem inicial no **Azure Web App** com posterior configuração de domínio próprio.

## > [!WARNING] User Review Required

1. **Alteração Estrutural (Breaking Change):** A mudança do PostgreSQL para o MongoDB exigirá alterações profundas no `schema.prisma`. O MongoDB usa `ObjectId` em vez de `UUID` e não suporta migrações relacionais padrão (`prisma migrate`), sendo necessário utilizar `prisma db push`. 
2. **Dados Existentes:** Como o banco está mudando de SQL para NoSQL, qualquer dado existente no PostgreSQL atual será perdido, a menos que um script de migração de dados seja criado.
3. **Suporte do Prisma ao CosmosDB:** O Prisma suporta o CosmosDB **exclusivamente através da API do MongoDB**. Certifique-se de que o CosmosDB criado na Azure esteja usando a "API for MongoDB".

## > [!IMPORTANT] Open Questions

1. O endereço IP fornecido (`177.55.244.226`) é para ser liberado (whitelisted) no firewall do MongoDB Atlas e futuramente no CosmosDB para permitir o acesso?
2. Existe algum dado no PostgreSQL atual que precisa ser migrado, ou podemos iniciar o banco de dados do zero?
3. O deploy na Azure será feito via GitHub Actions (CI/CD automático) ou de forma manual (via VSCode/CLI)?

---

## Proposed Changes

### Banco de Dados (Prisma & MongoDB)

A transição para o MongoDB requer as seguintes adaptações no código atual:

#### [MODIFY] [schema.prisma](file:///c:/Users/SURI%20-%20BEM%20085/Documents/SURI/universidade-suri/backend/prisma/schema.prisma)
- Alterar o `provider` do `datasource` de `"postgresql"` para `"mongodb"`.
- Remover a linha `directUrl`, que é específica para Supabase/PostgreSQL.
- Atualizar **todos** os campos de chave primária (`id`) para o formato do MongoDB:
  `id String @id @default(auto()) @map("_id") @db.ObjectId`
- Atualizar todas as chaves estrangeiras (ex: `userId`, `courseId`) para serem do tipo `String @db.ObjectId`.
- Remover atributos nativos do PostgreSQL que não funcionam no Mongo, como `@db.Uuid` e `@db.Timestamptz(6)`.
- Como o MongoDB não suporta chaves compostas reais (ex: `@@id([courseId, instructorId])`), será necessário adicionar um campo `id` autogerado em tabelas pivot/junção e manter um `@@unique` nelas.

#### [MODIFY] [.env](file:///c:/Users/SURI%20-%20BEM%20085/Documents/SURI/universidade-suri/backend/.env)
- Substituir as URLs do Supabase pela connection string do MongoDB:
  `DATABASE_URL="mongodb+srv://unisuri_db:<db_password>@clusterunisuri.m3bf4c5.mongodb.net/universidade-suri?appName=ClusterUniSuri"`

#### [MODIFY] [package.json](file:///c:/Users/SURI%20-%20BEM%20085/Documents/SURI/universidade-suri/backend/package.json)
- Alterar o script de migração. O MongoDB usa sincronização de índices ao invés de migrations clássicas.
- Mudar `"db:migrate": "ts-node scripts/migrate.ts"` para `"db:push": "npx prisma db push"`.

---

## Azure Web App Deployment Plan

O deploy será dividido nas seguintes etapas:

### 1. Preparação da Hospedagem (Azure Web App)
- Criar um **App Service** na Azure usando "Node.js 20 LTS" no sistema operacional Linux.
- Configurar as Variáveis de Ambiente no painel da Azure (Configurações > Variáveis de Ambiente):
  - `NODE_ENV=production`
  - `DATABASE_URL` (Sua string de conexão do Mongo)
  - `JWT_SECRET` e demais segredos presentes no seu `.env`.

### 2. Rotinas de Build e Deploy
- **Processo de Build:** A Azure rodará o comando `npm run build`, que compilará o NestJS para a pasta `/dist`. O comando de inicialização será configurado como `node dist/main.js`.
- Como o Prisma gera clientes de forma dinâmica, será necessário garantir que o comando `npx prisma generate` rode durante o build no ambiente de deploy.

### 3. Liberação de IP (Firewall)
- O IP `177.55.244.226` (provavelmente da rede corporativa/local) deverá ser adicionado na lista de "Network Access" do MongoDB Atlas.
- Quando o Azure Web App for criado, os IPs de saída (*Outbound IP Addresses*) dele também devem ser adicionados na lista de permitidos do MongoDB Atlas / CosmosDB.

### 4. Configuração de Domínio Próprio e SSL
Posteriormente, a transição para o domínio próprio ocorrerá da seguinte forma:
1. No painel do Azure Web App, em **Custom domains (Domínios Personalizados)**, adicionar o domínio desejado (ex: `api.unisuri.com.br`).
2. Adicionar os registros DNS informados pela Azure (um **TXT** para verificação de propriedade e um **CNAME** apontando para a URL padrão `.azurewebsites.net`) no provedor onde o domínio foi registrado (ex: Registro.br, Cloudflare, etc).
3. Após a validação do domínio, gerar um **App Service Managed Certificate** gratuitamente pela Azure e realizar o binding para forçar a conexão **HTTPS**.

## Verification Plan

### Testes Manuais
- Rodar `npx prisma db push` localmente com o MongoDB para validar se a estrutura foi criada no Atlas.
- Subir a API localmente (`npm run start:dev`) e testar rotas básicas, como cadastro e login, para garantir que as operações no MongoDB estão normais.
- Efetuar o deploy na Azure Web App e acessar a rota base `.azurewebsites.net` para validar a inicialização em produção.
- Testar a conexão do Azure Web App comunicando-se perfeitamente com o MongoDB na nuvem.
