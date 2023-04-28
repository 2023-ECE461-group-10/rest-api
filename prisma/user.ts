import { Prisma, PrismaClient } from '@prisma/client';
import { generatePasswordHash } from '../src/controllers/auth';

type UserCreate = {
    username: string,
    isAdmin: boolean,
    password: string
};

class UserModelUtils {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(user: UserCreate) {
        await this.createMany([user]);
    }

    async createMany(users: UserCreate[], skipDuplicates=true) {
        const dataPromises: Promise<Prisma.UserCreateManyInput>[] = users.map(async user => {
            return {
                username: user.username,
                isAdmin: user.isAdmin,
                passwordHash: await generatePasswordHash(user.password)
            };
        });
    
        const data: Prisma.UserCreateManyInput[] = await Promise.all(dataPromises);
    
        await this.prisma.user.createMany({
            data: data,
            skipDuplicates: skipDuplicates
        });
    }
}

export {
    UserCreate,
    UserModelUtils
};