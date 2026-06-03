# Guia: Como Configurar o Supabase para Testes no Projeto Universidade Suri

Este documento explica o passo a passo para conectar o backend da Universidade Suri a um banco de dados **Supabase** na nuvem, facilitando testes sem precisar rodar o PostgreSQL localmente via Docker.

## 1. Criar um projeto no Supabase
1. Acesse [Supabase](https://supabase.com) e faça login.
2. Crie um novo projeto (New Project).
3. Defina um nome (ex: `unisuri-testes`) e uma senha forte para o banco de dados. **Guarde esta senha**, pois você precisará dela.
4. Escolha a região mais próxima (ex: South America - São Paulo) e clique em `Create new project`.
5. Aguarde o projeto ser provisionado (pode levar alguns minutos).

## 2. Obter a String de Conexão do Banco de Dados
1. No painel do seu projeto no Supabase, vá até as configurações (ícone de engrenagem no menu lateral esquerdo).
2. Acesse **Database** em "Configuration".
3. Desça até a seção **Connection string** e selecione a aba **URI**.
4. Copie a string fornecida. Ela será parecida com isso:
   ```
   postgresql://postgres.[REFERENCIA_DO_PROJETO]:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
   ```
5. Substitua `[YOUR-PASSWORD]` pela senha que você criou no passo 1.

> **Importante para o Prisma**: Para testes, use a porta `5432` (conexão direta) para garantir que as migrações do Prisma funcionem sem problemas. Se for usar a porta `6543` (connection pooling), o Prisma exige configurações adicionais (`directUrl`). Como nosso `schema.prisma` está configurado de forma simples, **use a porta 5432**.

## 3. Configurar as Variáveis de Ambiente no Backend
1. No diretório `backend`, abra o arquivo `.env` (se não existir, copie o `.env.example`).
2. Localize a variável `DATABASE_URL` e substitua pelo URI que você copiou do Supabase. Adicione `?schema=public` no final.

**Exemplo no seu arquivo `.env`**:
```env
# ---------- Banco de Dados (PostgreSQL) ----------
DATABASE_URL="postgresql://postgres.[REFERENCIA_DO_PROJETO]:minha_senha_secreta@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?schema=public"

# Opcionalmente, você pode preencher as variáveis legadas se algum script precisar:
DATABASE_HOST="aws-0-sa-east-1.pooler.supabase.com"
DATABASE_PORT="5432"
DATABASE_USER="postgres.[REFERENCIA_DO_PROJETO]"
DATABASE_PASSWORD="minha_senha_secreta"
DATABASE_NAME="postgres"
```

## 4. Rodar as Migrations do Prisma
Agora que o projeto está conectado ao Supabase, precisamos criar as tabelas do sistema no banco em nuvem.

No terminal, dentro da pasta `backend`, execute:
```bash
npx prisma migrate dev --name init_supabase
```
*(Se estiver apenas testando temporariamente e não quiser gerenciar histórico de migrations, você pode usar `npx prisma db push` em vez de `migrate dev`)*.

Isso irá:
1. Conectar ao banco do Supabase.
2. Criar todas as tabelas (profiles, courses, modules, etc.).
3. Gerar o Prisma Client atualizado.

## 5. Rodar a Aplicação
Após as tabelas serem criadas no Supabase, você pode iniciar o backend normalmente:

```bash
npm run start:dev
```

## Resumo da Solução de Problemas
- **Erro de Conexão / Pooler**: O Supabase introduziu recentemente o "Supavisor". Certifique-se de que a string de conexão usa a porta `5432` se você for rodar migrations.
- **Erro no Prisma Client**: Se o backend der erros de tipagem do banco de dados, certifique-se de rodar `npx prisma generate` após alterar o banco.
- **Autenticação**: O Supabase possui seu próprio serviço de Autenticação, mas **este projeto usa autenticação JWT própria**. Você usará o Supabase **apenas como banco de dados PostgreSQL (Database)**. O sistema de login da aplicação vai continuar funcionando normalmente, salvando os usuários na tabela `profiles` do Supabase.
