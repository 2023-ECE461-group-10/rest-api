import { PrismaClient } from '@prisma/client';
import { generatePasswordHash } from '../auth';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await generatePasswordHash('correcthorsebatterystaple123(!__+@**(A’”`;DROP TABLE packages;');

  await prisma.user.upsert({
    where: { username: 'ece30861defaultadminuser' },
    update: {},
    create: {
      username: 'ece30861defaultadminuser',
      isAdmin: true,
      password_hash: passwordHash
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })