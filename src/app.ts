import express from 'express';
import * as OpenAPIValidator from 'express-openapi-validator';

import config from './config';
import logger from './logger';
global.logger = logger;

import PackagesRoute from './routes/packages';
import PackageRoute from './routes/package';
import AuthenticateRoute from './routes/authenticate';
import ResetRoute from './routes/reset';

import { OpenAPIErrorHandler } from './middleware/error';
import { AuthMiddleware } from './middleware/auth';

const app = express();

app.use(express.json({ limit: '1gb' }));
app.use(express.text());
app.use(express.urlencoded({extended: false}));

// OPEN API SCHEMA VALIDATION
app.use(OpenAPIValidator.middleware(config.openAPIValidatorOpts));

// API ROUTES
app.use('/authenticate', AuthenticateRoute);

// API ROUTES (AUTH REQUIRED)
app.use(AuthMiddleware);
app.use('/package', PackageRoute);
app.use('/packages', PackagesRoute);
app.use('/reset', ResetRoute);

// ERROR HANDLER
app.use(OpenAPIErrorHandler);

export {
    app
};