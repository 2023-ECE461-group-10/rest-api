import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'; 
import { PrismaClient } from '@prisma/client';
import { app } from '../../src/app';
import { generateAccessToken } from '../../src/controllers/auth';
import * as supertest from 'supertest';
import config from '../../src/config';
import fs from 'fs/promises';
import { readFileSync } from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const agent = supertest.agent(app);

const lodashBase64 = path.join(__dirname, '../data/lodash_5.0.0');
const lodash = readFileSync(lodashBase64).toString();

let adminToken: string;

beforeAll(async() => {
    adminToken = await generateAccessToken({
        username: config.defaultUserCreateCmd.username,
        isAdmin: config.defaultUserCreateCmd.isAdmin
    });
});

beforeEach(async() => {
    await prisma.package.deleteMany();
});

afterAll(async () => {
    prisma.$disconnect();
});

describe('/package', () => {
    it("Support a CRUD lifecycle", async () => {    
        const res = await agent.post("/package")
            .set('X-Authorization', adminToken)
            .send({
                Content: lodash
            });
        
        expect(res.statusCode).toBe(201);
        expect(res.body.metadata.Name).toBe('lodash');
        expect(res.body.metadata.Version).toBe('5.0.0');
        expect(res.body.data.Content).toBe(lodash);
        expect(res.body.data.URL).toBe(undefined);

        const id = res.body.metadata.ID;

        const res2 = await agent.get(`/package/${id}`)
            .set('X-Authorization', adminToken);
        
        expect(res2.statusCode).toBe(200);
        expect(res2.body.metadata.Name).toBe('lodash');
        expect(res2.body.metadata.Version).toBe('5.0.0');
        expect(res2.body.data.Content).toBe(lodash);

        const res3 = await agent.delete(`/package/${id}`)
            .set('X-Authorization', adminToken);
        
        expect(res3.statusCode).toBe(200);
    });

    it("Support deleting packages by name", async() => {
        const res = await agent.post("/package")
            .set('X-Authorization', adminToken)
            .send({
                Content: lodash
            });
        
        expect(res.statusCode).toBe(201);
        expect(res.body.metadata.Name).toBe('lodash');
        expect(res.body.metadata.Version).toBe('5.0.0');
        expect(res.body.data.Content).toBe(lodash);
        expect(res.body.data.URL).toBe(undefined);

        const res2 = await agent.delete(`/package/byName/lodash`)
            .set('X-Authorization', adminToken);

        expect(res2.statusCode).toBe(200);
    });
});