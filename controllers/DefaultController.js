/**
 * The DefaultController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic routes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/DefaultService');
const createAuthToken = async (request, response) => {
  await Controller.handleRequest(request, response, service.createAuthToken);
};

const packageByNameDelete = async (request, response) => {
  await Controller.handleRequest(request, response, service.packageByNameDelete);
};

const packageByNameGet = async (request, response) => {
  await Controller.handleRequest(request, response, service.packageByNameGet);
};

const packageByRegExGet = async (request, response) => {
  await Controller.handleRequest(request, response, service.packageByRegExGet);
};

const packageCreate = async (request, response) => {
  await Controller.handleRequest(request, response, service.packageCreate);
};

const packageDelete = async (request, response) => {
  await Controller.handleRequest(request, response, service.packageDelete);
};

const packageRate = async (request, response) => {
  await Controller.handleRequest(request, response, service.packageRate);
};

const packageRetrieve = async (request, response) => {
  await Controller.handleRequest(request, response, service.packageRetrieve);
};

const packageUpdate = async (request, response) => {
  await Controller.handleRequest(request, response, service.packageUpdate);
};

const packagesList = async (request, response) => {
  await Controller.handleRequest(request, response, service.packagesList);
};

const registryReset = async (request, response) => {
  await Controller.handleRequest(request, response, service.registryReset);
};


module.exports = {
  createAuthToken,
  packageByNameDelete,
  packageByNameGet,
  packageByRegExGet,
  packageCreate,
  packageDelete,
  packageRate,
  packageRetrieve,
  packageUpdate,
  packagesList,
  registryReset,
};
