import { PrismaClient } from '@prisma/client';
import config from '../src/config';
import { UserModelUtils } from './user';

const prisma = new PrismaClient();

async function main() {
  await new UserModelUtils(prisma).create(config.defaultUserCreateCmd);
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