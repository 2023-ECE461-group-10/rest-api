import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'; 
import { PrismaClient } from '@prisma/client';
import { app } from '../../src/app';
import { generateAccessToken } from '../../src/controllers/auth';
import * as supertest from 'supertest';
import config from '../../src/config';
import { UserModelUtils, UserCreate } from '../../prisma/user';

const prisma = new PrismaClient();
const userModelUtils = new UserModelUtils(prisma);
const agent = supertest.agent(app);

const nonAdminCreateCmds: UserCreate[] = genNonAdminUsers(10);
const allCreateCmds: UserCreate[] = nonAdminCreateCmds.concat(config.defaultUserCreateCmd);

let adminToken: string;
let nonAdminToken: string;

beforeAll(async() => {
    await prisma.user.deleteMany();

    adminToken = await generateAccessToken({
        username: config.defaultUserCreateCmd.username,
        isAdmin: config.defaultUserCreateCmd.isAdmin
    });

    console.log(adminToken);

    nonAdminToken = await generateAccessToken({
        username: nonAdminCreateCmds[0].username,
        isAdmin: nonAdminCreateCmds[0].isAdmin
    });
});

beforeEach(async () => {
    await userModelUtils.createMany(allCreateCmds);
});

afterEach(async () => {
    prisma.user.deleteMany();
});

afterAll(async () => {
    prisma.$disconnect();
});

describe('DELETE /reset', () => {
    it("should return 200 and reset registry when asked by admin user", async () => {        
        const res = await agent.delete("/reset")
            .set('X-Authorization', adminToken);

        expect(res.statusCode).toBe(200);
        expectDBResetState();
    });

    it("should return 401 and not change db when asked by non admin user", async () => {
        const res = await agent.delete("/reset")
            .set('X-Authorization', nonAdminToken);

        expect(res.statusCode).toBe(401);
        expectDBUnchanged();
    });

    it("should return 400 and not change db when given invalid X-Authorization header", async () => {
        const res = await agent.delete('/reset')
            .set('X-Authorization', 'invalid token');
        
        expect(res.statusCode).toBe(400);
        expectDBUnchanged();
    });
    
    it("should return 400 and not change db when X-Authorization header is missing", async () => {
        const res = await agent.delete('/reset');

        expect(res.statusCode).toBe(400);
        expectDBUnchanged();
    });
});

function genNonAdminUsers(count: number): UserCreate[] {
    return [...Array(count).keys()].map(i => {
        return {
            username: 'user' + i.toString(),
            isAdmin: false,
            password: 'password' + i.toString()
        }
    });
}

async function expectDBResetState(): Promise<void> {
    const users = await findAllUsers();
    expect(users.length).toBe(1);
    expect(users[0].username).toBe(config.defaultUserCreateCmd.username);
    expect(users[0].isAdmin).toBe(config.defaultUserCreateCmd.isAdmin);
}

async function expectDBUnchanged(): Promise<void> {
    expect((await findAllUsers()).length).toBe(allCreateCmds.length);
}

function findAllUsers(): Promise<{ username: string; isAdmin: boolean }[]> {
    return prisma.user.findMany({
        select: {
            username: true,
            isAdmin: true
        }
    });
}
