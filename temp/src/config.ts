export = {
    openAPIValidatorOpts: {
        apiSpec: process.env.APISPEC,
        validateResponses: process.env.OPENAPI_VALIDATOR_VALIDATE_RESPONSES == '1'
    },
    jwtSignOpts: {
        expiresIn: process.env.JWT_EXPIRATION_SECONDS + 's'
    }
};