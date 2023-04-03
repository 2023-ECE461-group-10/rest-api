import * as path from 'path';

export = {
    openAPIValidatorOpts: {
        apiSpec: path.join(__dirname, '../openapi/apispec.yaml'),
        validateResponses: process.env.OPENAPI_VALIDATOR_VALIDATE_RESPONSES == '1'
    },
    jwtSignOpts: {
        expiresIn: process.env.JWT_EXPIRATION_SECONDS + 's'
    }
};