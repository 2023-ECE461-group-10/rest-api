import express from 'express';
import * as OpenAPIValidator from 'express-openapi-validator';

import constants from './constants';
import config from './config';

import PackagesRoute from './routes/packages';
import PackageRoute from './routes/package';
import AuthenticateRoute from './routes/authenticate';
import ResetRoute from './routes/reset';

import { OpenAPIErrorHandler } from './middleware/error';

const app = express();

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({extended: false}));

// OPEN API SCHEMA VALIDATION
app.use(OpenAPIValidator.middleware({
  'apiSpec': constants.apiSpec,
  'validateResponses': true
}));

app.use('/authenticate', AuthenticateRoute);
app.use('/package', PackageRoute);
app.use('/packages', PackagesRoute);
app.use('/reset', ResetRoute);

// ERROR HANDLER
app.use(OpenAPIErrorHandler);

app.listen(config.port, () => console.log(`Running on port ${config.port}`));
