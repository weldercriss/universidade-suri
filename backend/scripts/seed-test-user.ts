import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5435'),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'unisuri_db',
  });

  const email = 'admin@suri.com';
  const rawPassword = 'SuriAdmin123';
  const name = 'Administrador Suri';

  console.log(`Cadastrando usuário teste administrativo (${email})...`);

  try {
    await client.connect();

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    // Insert user
    const res = await client.query(`
      INSERT INTO profiles (name, email, password_hash, group_type, tier, xp, level, is_admin)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, is_admin = TRUE
      RETURNING id, name, email
    `, [name, email, passwordHash, 'vip', 'VIP PLUS', 4820, 7, true]);

    console.log('✅ Usuário administrativo cadastrado com sucesso!');
    console.log('E-mail:', res.rows[0].email);
    console.log('Senha:', rawPassword);
  } catch (err) {
    console.error('❌ Falha ao cadastrar usuário administrativo:', err);
  } finally {
    await client.end();
  }
}

main();
