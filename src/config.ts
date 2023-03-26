export = {
    openAPIValidatorOpts: {
        apiSpec: process.env.APISPEC,
        validateResponses: process.env.OPENAPI_VALIDATOR_VALIDATE_RESPONSES == '1'
    }
};