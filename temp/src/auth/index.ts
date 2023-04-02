import jwt from 'jsonwebtoken';
import { AuthTokenData } from '../types/auth';
import config from '../config';
import { User, UserAuthenticationInfo } from '../types/api';


export function generateAccessToken(data: AuthTokenData): string {
    return jwt.sign(data, process.env.JWT_SECRET, config.jwtSignOpts);
}

export function verifyAccessToken(token: string): Promise<AuthTokenData> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET, (err, authTokenData: AuthTokenData) => {
            if (err) reject(err);
            resolve(authTokenData)
        });
    });
}

export async function authenticate(user: User, authInfo: UserAuthenticationInfo): Promise<string> {
    // access database to verify username and password
    // If success, continue
    // If not, reject returned promise

    const tokenData: AuthTokenData = {
        username: user.name,
        isAdmin: user.isAdmin
    };
    return Promise.resolve(generateAccessToken(tokenData));
}