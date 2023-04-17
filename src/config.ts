import * as path from 'path';
import { UserCreate } from '../prisma/user';

type Config = {
    openAPIValidatorOpts: {
        apiSpec: string,
        validateResponses: boolean
    },
    jwtSignOpts: {
        expiresIn: string
    },
    defaultUserCreateCmd: UserCreate
}

const config: Config = {
    openAPIValidatorOpts: {
        apiSpec: path.join(__dirname, '../openapi/apispec.yaml'),
        validateResponses: process.env.OPENAPI_VALIDATOR_VALIDATE_RESPONSES == '1'
    },
    jwtSignOpts: {
        expiresIn: process.env.JWT_EXPIRATION_SECONDS + 's'
    },
    defaultUserCreateCmd: {
        username: process.env.DEFAULT_USER_NAME || 'admin',
        isAdmin: process.env.DEFAULT_USER_ISADMIN == '1',
        password: process.env.DEFAULT_USER_PASSWORD || 'admin'
    }
};

export = config;