/**
 * Migração de dados Supabase (PostgreSQL) -> MongoDB Atlas.
 *
 * Lê todas as tabelas do Supabase via `pg` e insere no Mongo via Prisma Client.
 * Os IDs no Postgres são UUID; no Mongo são ObjectId. Como UUIDs são únicos entre
 * todas as tabelas, mantemos UM mapa global UUID -> ObjectId(hex). Qualquer valor
 * de campo que seja um UUID (id ou FK) é trocado pelo ObjectId correspondente.
 *
 * Estratégia: "limpar e reimportar" — cada collection migrada é apagada antes de inserir.
 *
 * Uso:
 *   npx ts-node scripts/migrate-supabase-to-mongo.ts            # migra TODAS as tabelas
 *   npx ts-node scripts/migrate-supabase-to-mongo.ts profiles   # migra só 'profiles' (teste)
 *   npx ts-node scripts/migrate-supabase-to-mongo.ts profiles courses
 *   npx ts-node scripts/migrate-supabase-to-mongo.ts --dry-run profiles   # só lê e conta, não escreve
 *
 * Requer no .env: SUPABASE_PG_URL (origem) e DATABASE_URL (destino Mongo).
 */
import 'dotenv/config';
import { Client } from 'pg';
import { PrismaClient, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

/** Ordem de migração: tabela Postgres -> delegate do Prisma Client. */
const TABLES: { pg: string; model: string }[] = [
  { pg: 'user_roles', model: 'userRole' },
  { pg: 'profiles', model: 'profile' },
  { pg: 'courses', model: 'course' },
  { pg: 'instructors', model: 'instructor' },
  { pg: 'course_instructors', model: 'courseInstructor' },
  { pg: 'modules', model: 'module' },
  { pg: 'enrollments', model: 'enrollment' },
  { pg: 'module_progress', model: 'moduleProgress' },
  { pg: 'certificates', model: 'certificate' },
  { pg: 'posts', model: 'post' },
  { pg: 'post_likes', model: 'postLike' },
  { pg: 'post_comments', model: 'postComment' },
  { pg: 'trails', model: 'trail' },
  { pg: 'trail_courses', model: 'trailCourse' },
  { pg: 'trail_enrollments', model: 'trailEnrollment' },
  { pg: 'trail_certificates', model: 'trailCertificate' },
  { pg: 'trail_quiz_attempts', model: 'trailQuizAttempt' },
  { pg: 'trail_quiz_attempt_answers', model: 'trailQuizAttemptAnswer' },
  { pg: 'questions', model: 'question' },
  { pg: 'quiz_attempts', model: 'quizAttempt' },
  { pg: 'quiz_attempt_answers', model: 'quizAttemptAnswer' },
  { pg: 'quiz_extra_attempts', model: 'quizExtraAttempt' },
  { pg: 'group_rules', model: 'groupRule' },
  { pg: 'system_settings', model: 'systemSetting' },
  { pg: 'xp_rules', model: 'xpRule' },
  { pg: 'roadmaps', model: 'roadmap' },
  { pg: 'roadmap_items', model: 'roadmapItem' },
  { pg: 'api_tokens', model: 'apiToken' },
];

/** UUID v4/v1 padrão do Postgres: 8-4-4-4-12 com hífens. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mapa global UUID -> ObjectId(hex 24). Mesmo UUID sempre gera o mesmo ObjectId. */
const idMap = new Map<string, string>();
function mapId(uuid: string): string {
  let oid = idMap.get(uuid);
  if (!oid) {
    oid = randomBytes(12).toString('hex'); // 12 bytes = 24 hex chars = ObjectId válido
    idMap.set(uuid, oid);
  }
  return oid;
}

const snakeToCamel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

/** Campos escalares válidos por delegate (a partir do DMMF do Prisma). Exclui relações. */
const allowedFields = new Map<string, Set<string>>();
for (const m of Prisma.dmmf.datamodel.models) {
  const delegate = m.name.charAt(0).toLowerCase() + m.name.slice(1);
  const scalars = m.fields
    .filter((f) => f.kind === 'scalar' || f.kind === 'enum')
    .map((f) => f.name);
  allowedFields.set(delegate, new Set(scalars));
}

/**
 * Converte uma linha do Postgres para o formato Prisma (Mongo): snake->camel,
 * UUID->ObjectId, descartando colunas que não existem no schema atual.
 */
function transformRow(
  row: Record<string, unknown>,
  allowed: Set<string>,
  dropped: Set<string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) continue; // deixa o Prisma aplicar defaults
    const camel = snakeToCamel(key);
    if (!allowed.has(camel)) {
      dropped.add(key);
      continue;
    }
    out[camel] = typeof value === 'string' && UUID_RE.test(value) ? mapId(value) : value;
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const requested = args.filter((a) => !a.startsWith('--'));
  const targets = requested.length
    ? TABLES.filter((t) => requested.includes(t.pg) || requested.includes(t.model))
    : TABLES;

  if (requested.length && targets.length !== requested.length) {
    const found = targets.flatMap((t) => [t.pg, t.model]);
    const missing = requested.filter((r) => !found.includes(r));
    throw new Error(`Tabela(s) desconhecida(s): ${missing.join(', ')}`);
  }

  const pgUrl = process.env.SUPABASE_PG_URL;
  if (!pgUrl) throw new Error('Defina SUPABASE_PG_URL no .env (conexão de origem Supabase).');

  const pg = new Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
  const prisma = new PrismaClient();

  await pg.connect();
  console.log(`✓ Conectado ao Supabase`);
  console.log(`${dryRun ? '[DRY-RUN] ' : ''}Migrando ${targets.length} tabela(s)\n`);

  const summary: { table: string; lidas: number; inseridas: number }[] = [];

  try {
    for (const { pg: table, model } of targets) {
      const { rows } = await pg.query(`SELECT * FROM "${table}"`);
      const allowed = allowedFields.get(model)!;
      const dropped = new Set<string>();
      const data = rows.map((r) => transformRow(r, allowed, dropped));
      const delegate = (prisma as any)[model];

      if (dropped.size) {
        console.log(`    ↳ colunas ignoradas (sem campo no schema): ${[...dropped].join(', ')}`);
      }

      if (dryRun) {
        console.log(`  ${table.padEnd(28)} ${rows.length} linhas (dry-run, não escrito)`);
        summary.push({ table, lidas: rows.length, inseridas: 0 });
        continue;
      }

      const deleted = await delegate.deleteMany({});
      let inserted = 0;
      if (data.length) {
        const res = await delegate.createMany({ data });
        inserted = res.count ?? data.length;
      }
      console.log(
        `  ${table.padEnd(28)} apagadas=${String(deleted.count).padEnd(5)} lidas=${String(
          rows.length,
        ).padEnd(5)} inseridas=${inserted}`,
      );
      summary.push({ table, lidas: rows.length, inseridas: inserted });
    }

    console.log('\n=== Resumo ===');
    let totalL = 0;
    let totalI = 0;
    for (const s of summary) {
      totalL += s.lidas;
      totalI += s.inseridas;
    }
    console.table(summary);
    console.log(`Total lidas=${totalL} inseridas=${totalI}  | UUIDs mapeados=${idMap.size}`);
  } finally {
    await pg.end();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('\n✗ Falha na migração:', err);
  process.exit(1);
});
