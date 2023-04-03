import { describe, it, expect } from '@jest/globals';
import { verifyAccessToken } from '../src/auth';
import { app } from '../src/server';
import { User, UserAuthenticationInfo } from '../src/types/api';
import * as request from 'supertest';

describe('PUT /authenticate', () => {
    it("should return a valid token", async () => {        
        const user: User = {
            name: "TestUser",
            isAdmin: true
        };
        const secret: UserAuthenticationInfo = {
            password: "Password"
        };
        
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
});