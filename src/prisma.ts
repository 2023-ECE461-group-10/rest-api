import { PrismaClient } from '@prisma/client';
import { UserModelUtils } from '../prisma/user';

const prisma = new PrismaClient();
const userModelUtils = new UserModelUtils(prisma);

export {
    prisma,
    userModelUtils
};