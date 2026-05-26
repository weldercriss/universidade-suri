import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = "welder@suri.ai"; // Is this his email?
  // Let's find him first
  const users = await prisma.profile.findMany();
  console.log("Users found:", users.map(u => u.email));
  
  if (users.length > 0) {
    const userToUpdate = users[0]; // the first user is likely Welder
    await prisma.profile.update({
      where: { id: userToUpdate.id },
      data: { isAdmin: true, groupType: 'admin' }
    });
    console.log(`Updated user ${userToUpdate.email} to Admin!`);
  } else {
    console.log("No users found in database!");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
