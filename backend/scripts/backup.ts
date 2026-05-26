import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const TABLES = ['user_roles', 'profiles', 'courses', 'modules', 'enrollments', 'module_progress', 'certificates'];

async function main() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'unisuri_db',
  });

  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const backupFile = path.join(backupDir, `backup-${dateStr}.sql`);

  console.log(`Iniciando backup do banco de dados para ${backupFile}...`);

  try {
    await client.connect();
    let sqlContent = `-- Backup da Universidade Suri gerado em ${new Date().toISOString()}\n\n`;

    // Drop tables in reverse order to respect FK constraints
    sqlContent += `TRUNCATE TABLE ${TABLES.reverse().join(', ')} CASCADE;\n\n`;
    
    // Put TABLES back in normal order for insertions
    TABLES.reverse();

    for (const table of TABLES) {
      const res = await client.query(`SELECT * FROM ${table}`);
      if (res.rows.length === 0) continue;

      sqlContent += `-- Inserções para a tabela ${table}\n`;
      for (const row of res.rows) {
        const columns = Object.keys(row).join(', ');
        const values = Object.values(row).map(val => {
          if (val === null) return 'NULL';
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val)}'`;
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          return val;
        }).join(', ');
        
        sqlContent += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
      }
      sqlContent += '\n';
    }

    fs.writeFileSync(backupFile, sqlContent);
    console.log(`✅ Backup concluído com sucesso! Salvo em: ${backupFile}`);
  } catch (err) {
    console.error('❌ Falha ao gerar o backup:', err);
  } finally {
    await client.end();
  }
}

main();
