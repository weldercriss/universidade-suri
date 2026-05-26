import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5431/unisuri_db?schema=public'
  });

  console.log('Iniciando sincronização de esquemas do banco de dados...');
  try {
    await client.connect();
    
    // Check tables in public schema
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = res.rows.map(r => r.table_name);
    const expected = ['profiles', 'courses', 'modules', 'enrollments', 'module_progress', 'certificates', 'user_roles', 'posts', 'post_likes', 'post_comments'];
    
    console.log('Tabelas encontradas no banco:', tables.join(', '));
    
    const missing = expected.filter(t => !tables.includes(t));
    if (missing.length > 0) {
      console.log('⚠️ Tabelas ausentes detectadas:', missing.join(', '));
      console.log('Recomendado rodar o script de migração: npm run db:migrate');
    } else {
      console.log('✅ Banco de dados sincronizado e íntegro!');
    }
  } catch (err) {
    console.error('Erro na sincronização:', err);
  } finally {
    await client.end();
  }
}

main();
