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
    defaultUserCreateCmd: UserCreate,
    gcpStorageClientConfig: {
        keyFilename: string
    }
}

const testing = process.env.TESTING == '1';
const apiSpec = testing ?
    path.join(__dirname, '../openapi/apispec.yaml') :
    path.join(__dirname, '../../openapi/apispec.yaml');

const config: Config = {
    openAPIValidatorOpts: {
        apiSpec: apiSpec,
        validateResponses: process.env.OPENAPI_VALIDATOR_VALIDATE_RESPONSES == '1'
    },
    jwtSignOpts: {
        expiresIn: process.env.JWT_EXPIRATION_SECONDS + 's'
    },
    defaultUserCreateCmd: {
        username: process.env.DEFAULT_USER_NAME || 'admin',
        isAdmin: process.env.DEFAULT_USER_ISADMIN == '1',
        password: process.env.DEFAULT_USER_PASSWORD || 'admin'
    },
    gcpStorageClientConfig: {
        keyFilename: process.env.GCP_KEY_FILE_LOCATION || ''
    }
};

export = config;