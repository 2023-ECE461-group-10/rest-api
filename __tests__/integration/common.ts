import * as supertest from 'supertest';
import * as api from '../../src/types/api';

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

export {
    sendAuthenticateRequest
};