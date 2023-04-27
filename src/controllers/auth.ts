import jwt from 'jsonwebtoken';
import { AuthTokenData } from '../types/auth';
import config from '../config';
import api from '../types/api';
import { prisma } from '../clients';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

function generateAccessToken(data: AuthTokenData): string {
    return jwt.sign(data, process.env.JWT_SECRET, config.jwtSignOpts);
}

function verifyAccessToken(token: string): Promise<AuthTokenData> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET, (err, authTokenData: AuthTokenData) => {
            if (err) reject(err);
            resolve(authTokenData)
        });
    });
}

function generatePasswordHash(plainTextPassword: string): Promise<string> {
    return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

function verifyPasswordHash(hash: string, plainTextPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hash);
}

async function authenticate(user: api.User, authInfo: api.UserAuthenticationInfo): Promise<string> {
    const userRecord = await prisma.user.findUnique({where: { username: user.name }});

    if (!userRecord) {
        throw new Error("Invalid username");
    }

    const pwdVerified = await verifyPasswordHash(userRecord.passwordHash, authInfo.password);

    if (!pwdVerified) {
        throw new Error("Invalid credentials");
    }

    const tokenData: AuthTokenData = {
        username: userRecord.username,
        isAdmin: userRecord.isAdmin
    };
    return Promise.resolve(generateAccessToken(tokenData));
}

export {
    generateAccessToken,
    verifyAccessToken,
    generatePasswordHash,
    verifyPasswordHash,
    authenticate
};