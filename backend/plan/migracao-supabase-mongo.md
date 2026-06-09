# Migração de dados Supabase (PostgreSQL) → MongoDB Atlas

Migração one-off dos dados de produção do Supabase para o MongoDB Atlas (schema já portado).

## Contexto
- Origem: Supabase/PostgreSQL, PKs em `UUID`. Conexão em `SUPABASE_PG_URL` (`.env`, somente leitura).
- Destino: MongoDB Atlas, PKs em `ObjectId`. Conexão em `DATABASE_URL`.
- IDs e FKs precisam ser remapeados UUID → ObjectId.
- Estratégia escolhida: **limpar e reimportar** (cada collection é apagada antes de inserir).

## Implementação — `scripts/migrate-supabase-to-mongo.ts`
- [x] Mapa global `UUID → ObjectId(hex)` (UUIDs são únicos entre tabelas; um mapa resolve todas as FKs).
- [x] Detecção de FK por regex de UUID (`8-4-4-4-12`); `verificationCode`/`resetPasswordToken` não colidem.
- [x] Conversão genérica de nomes `snake_case` → `camelCase`.
- [x] Filtro por DMMF do Prisma — descarta colunas órfãs da origem (ex.: `is_verified` em `profiles`).
- [x] Inserção via Prisma `createMany` (aplica defaults p/ campos novos como `newsletter`).
- [x] CLI: tabelas posicionais p/ teste, `--dry-run`, sem args = todas as 28 tabelas.
- [x] npm script `db:migrate:mongo`.

## Execução
- [x] Dry-run `profiles` — conexão OK, 6 linhas lidas.
- [x] Migração real `profiles` — 6 inseridas, leitura validada via Prisma (ObjectIds válidos, defaults aplicados).
- [x] Migração completa (28 tabelas) — `npm run db:migrate:mongo` — **73 lidas = 73 inseridas**, sem erros.
- [x] Validação pós-migração — relações resolvem (enrollment/post/quizAttempt/module) e 0 registros órfãos.

## Frontend
Nada a fazer — migração puramente de dados/backend.
