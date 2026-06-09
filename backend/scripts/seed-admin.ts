import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@suri.com'; // O email do admin
  const password = 'admin123';    // A senha do admin (mínimo de 6 caracteres)

  console.log('Gerando hash da senha...');
  const passwordHash = await bcrypt.hash(password, 10);

  console.log('Criando ou atualizando o administrador no MongoDB...');
  const admin = await prisma.profile.upsert({
    where: { email },
    update: {
      passwordHash: passwordHash,
      isAdmin: true,
      groupType: 'admin',
    },
    create: {
      name: 'Administrador Suri',
      email: email,
      passwordHash: passwordHash,
      isAdmin: true,
      groupType: 'admin',
      tier: 'Admin',
      xp: 0,
      level: 1,
      isActive: true,
    },
  });

  console.log('====================================');
  console.log('✅ Administrador configurado com sucesso!');
  console.log(`📧 Email: ${admin.email}`);
  console.log(`🔑 Senha: ${password}`);
  console.log('====================================');
}

main()
  .catch((e) => {
    console.error('Erro ao configurar admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
