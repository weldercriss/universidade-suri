import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

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
    console.error('❌ Nenhuma pasta de backups encontrada!');
    return;
  }

  const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.sql')).sort();
  if (files.length === 0) {
    console.error('❌ Nenhum arquivo de backup .sql encontrado para restaurar!');
    return;
  }

  // Get the most recent file (last in alphabetic sort)
  const targetFile = path.join(backupDir, files[files.length - 1]);
  console.log(`Restaurando banco de dados a partir de: ${targetFile}...`);

  try {
    const sql = fs.readFileSync(targetFile, 'utf8');
    await client.connect();
    
    // Begin transaction for safety
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✅ Banco de dados restaurado com sucesso!');
  } catch (err) {
    console.error('❌ Falha ao restaurar banco de dados:', err);
    try {
      await client.query('ROLLBACK');
    } catch {}
  } finally {
    await client.end();
  }
}

main();
