# ADR 004 — Prisma ORM com PostgreSQL

**Data:** 2025-05-26
**Status:** Aceito

---

## Contexto

O backend da Universidade Suri precisa de um ORM para interagir com o banco de dados PostgreSQL. Os requisitos são:
- Type-safety total com TypeScript
- Migrations versionadas e reproduzíveis
- Proteção contra SQL Injection
- Facilidade de uso com NestJS

### Opções Consideradas

| Opção | Type-safety | Migrations | SQL Injection | Ecossistema |
|---|---|---|---|---|
| SQL puro (pg) | ❌ Manual | ❌ Manual | ⚠️ Cuidado | ✅ Universal |
| TypeORM | ⚠️ Parcial | ✅ Auto | ✅ Protegido | ⚠️ Manutenção lenta |
| Drizzle ORM | ✅ Excelente | ✅ Auto | ✅ Protegido | ⚠️ Jovem |
| **Prisma ORM** | ✅ Excelente | ✅ Auto | ✅ Protegido | ✅ Maduro |

## Decisão

Adotamos **Prisma ORM** como camada de acesso ao banco de dados.

### Schema-first

O Prisma usa uma abordagem **schema-first** onde o modelo de dados é definido em `prisma/schema.prisma` e o client TypeScript é gerado automaticamente:

```prisma
model Profile {
  id           String   @id @default(uuid()) @db.Uuid
  name         String
  email        String   @unique
  passwordHash String   @map("password_hash")
  // ...
}
```

### Integração com NestJS

O `PrismaService` é injetado como provider singleton no `AppModule`:

```ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

### Workflow de Migrations

```bash
# Desenvolvimento: cria migration + aplica + regenera client
npx prisma migrate dev --name nome_da_migration

# Produção: aplica migrations pendentes (sem criar novas)
npx prisma migrate deploy

# Visualizar banco: interface gráfica
npx prisma studio
```

## Consequências

### Positivas
- **Type-safety automática**: Client gerado com tipos exatos do schema
- **Proteção contra SQL Injection**: Queries parametrizadas por padrão
- **Migrations reproduzíveis**: Versionadas em SQL puro, fácil de auditar
- **Prisma Studio**: Interface visual para debug e seed de dados
- **Ecossistema maduro**: Boa documentação, comunidade ativa

### Negativas
- **Overhead de geração**: `npx prisma generate` necessário após mudanças no schema
- **Queries complexas**: Alguns JOINs avançados requerem `$queryRaw`
- **Lock-in**: Migrar para outro ORM requer reescrever repositórios (mitigado pela Clean Architecture — ADR 002)
- **Cold start**: Client pode aumentar o tempo de inicialização

## Referências

- Schema: `backend/prisma/schema.prisma`
- Service: `backend/src/infrastructure/database/prisma.service.ts`
- [Prisma Docs](https://www.prisma.io/docs)
