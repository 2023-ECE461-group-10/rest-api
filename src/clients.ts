import { PrismaClient } from '@prisma/client';
import { UserModelUtils } from '../prisma/user';
import { PackageModelUtils } from '../prisma/package';
import { Storage } from '@google-cloud/storage';
import config from './config';

const prisma = new PrismaClient();
const userModelUtils = new UserModelUtils(prisma);
const pkgModelUtils = new PackageModelUtils(prisma);
const gcpStorage = new Storage(config.gcpStorageClientConfig);

export {
    prisma,
    userModelUtils,
    pkgModelUtils,
    gcpStorage
};