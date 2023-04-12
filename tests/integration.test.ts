import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { generatePasswordHash, verifyAccessToken } from '../src/auth';
import { app } from '../src/server';
import { User, UserAuthenticationInfo } from '../src/types/api';
import * as request from 'supertest';
import prisma from '../src/db';

const user: User = {
    name: "ece30861defaultadminuser",
    isAdmin: true
};
const secret: UserAuthenticationInfo = {
    password: 'correcthorsebatterystaple123(!__+@**(A’”`;DROP TABLE packages;'
};

beforeAll(async () => {
    const passwordHash = await generatePasswordHash(secret.password);

    await prisma.user.create({
        data: {
          username: user.name,
          isAdmin: user.isAdmin,
          password_hash: passwordHash
        }
      });
});

afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
});

describe('PUT /authenticate', () => {
    // Valid username, Valid password
    it("should return a valid token", async () => {        
        const res = await request.agent(app).put("/authenticate")
            .set('Content-Type', 'application/json')
            .send({
                User: user,
                Secret: secret
            });

        expect(res.statusCode).toBe(200);
        const tokenData = await verifyAccessToken(res.body);
        expect(tokenData.username).toBe(user.name);
        expect(tokenData.isAdmin).toBe(user.isAdmin);
    });

    // Valid username, Invalid password
    it("should return a 401 error", async () => {
        secret.password = 'invalid password';

        const res = await request.agent(app).put("/authenticate")
            .set('Content-Type', 'application/json')
            .send({
                User: user,
                Secret: secret
            });

        expect(res.statusCode).toBe(401);
    });

    // Invalid username
    it("should return a 401 error", async () => {
        user.name = 'invalid username';

        const res = await request.agent(app).put("/authenticate")
            .set('Content-Type', 'application/json')
            .send({
                User: user,
                Secret: secret
            });

        expect(res.statusCode).toBe(401);
    });
});