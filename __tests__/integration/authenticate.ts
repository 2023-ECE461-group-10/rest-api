import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken } from '../../src/controllers/auth';
import { app } from '../../src/app';
import { User, UserAuthenticationInfo } from '../../src/types/api';
import * as supertest from 'supertest';
import config from '../../src/config';
import { UserModelUtils } from '../../prisma/user';
import * as api from '../../src/types/api';

const prisma = new PrismaClient();
const userModelUtils = new UserModelUtils(prisma);
const agent = supertest.agent(app);

const defaultUser: User = {
    name: config.defaultUserCreateCmd.username,
    isAdmin: config.defaultUserCreateCmd.isAdmin
};

const defaultSecret: UserAuthenticationInfo = {
    password: config.defaultUserCreateCmd.password
};

beforeAll(async () => {
    await prisma.user.deleteMany();
    await userModelUtils.create({
        username: defaultUser.name,
        isAdmin: defaultUser.isAdmin,
        password: defaultSecret.password
    });
});

afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
});

describe('PUT /authenticate', () => {
    it("should return a valid token for a valid username and password", async () => {        
        const res = await sendAuthenticateRequest(agent, defaultUser, defaultSecret);

        expect(res.statusCode).toBe(200);
        const tokenData = await verifyAccessToken(res.body);
        expect(tokenData.username).toBe(config.defaultUserCreateCmd.username);
        expect(tokenData.isAdmin).toBe(config.defaultUserCreateCmd.isAdmin);
    });

    it("should return a 401 error for an invalid password", async () => {
        defaultSecret.password = 'invalid password';
        const res = await sendAuthenticateRequest(agent, defaultUser, defaultSecret);

        expect(res.statusCode).toBe(401);
    });

    it("should return a 401 error for an invalid username", async () => {
        defaultUser.name = 'invalid username';
        const res = await sendAuthenticateRequest(agent, defaultUser, defaultSecret);

        expect(res.statusCode).toBe(401);
    });

    it("should return a 400 error for an invalid request body", async() => {
        const res = await agent.put("/authenticate")
            .set('Content-Type', 'application/json')
            .send({
                user: defaultUser,
                secret: defaultSecret
            });

        expect(res.statusCode).toBe(400);
    });

    it("should return a 400 error for an empty request body", async() => {
        const res = await agent.put("/authenticate")
            .set('Content-Type', 'application/json')
            .send({});

        expect(res.statusCode).toBe(400);
    });
});

async function sendAuthenticateRequest(
    agent: supertest.SuperAgentTest,
    user: api.User,
    secret: api.UserAuthenticationInfo):
    Promise<supertest.Response>
{
    return await agent.put("/authenticate")
        .set('Content-Type', 'application/json')
        .send({
            User: user,
            Secret: secret
        });
}