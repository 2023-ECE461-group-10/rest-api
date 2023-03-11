/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Create an access token.
*
* authenticationRequest AuthenticationRequest 
* returns String
* */
const createAuthToken = ({ authenticationRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        authenticationRequest,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Delete all versions of this package.
*
* name String 
* xAuthorization String  (optional)
* no response value expected for this operation
* */
const packageByNameDelete = ({ name, xAuthorization }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        name,
        xAuthorization,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Return the history of this package (all versions).
*
* name String 
* xAuthorization String  (optional)
* returns List
* */
const packageByNameGet = ({ name, xAuthorization }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        name,
        xAuthorization,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Get any packages fitting the regular expression.
* Search for a package using regular expression over package names and READMEs. This is similar to search by name.
*
* regex String 
* body String 
* xAuthorization String  (optional)
* returns List
* */
const packageByRegExGet = ({ regex, body, xAuthorization }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        regex,
        body,
        xAuthorization,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
*
* xAuthorization String 
* packageData PackageData 
* returns Package
* */
const packageCreate = ({ xAuthorization, packageData }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xAuthorization,
        packageData,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Delete this version of the package.
*
* id String Package ID
* xAuthorization String  (optional)
* no response value expected for this operation
* */
const packageDelete = ({ id, xAuthorization }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
        xAuthorization,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
*
* id String 
* xAuthorization String  (optional)
* returns PackageRating
* */
const packageRate = ({ id, xAuthorization }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
        xAuthorization,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Interact with the package with this ID
* Return this package.
*
* id String ID of package to fetch
* xAuthorization String  (optional)
* returns Package
* */
const packageRetrieve = ({ id, xAuthorization }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
        xAuthorization,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Update this content of the package.
* The name, version, and ID must match.  The package contents (from PackageData) will replace the previous contents.
*
* id String 
* package Package 
* xAuthorization String  (optional)
* no response value expected for this operation
* */
const packageUpdate = ({ id, package, xAuthorization }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
        package,
        xAuthorization,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Get the packages from the registry.
* Get any packages fitting the query. Search for packages satisfying the indicated query.  If you want to enumerate all packages, provide an array with a single PackageQuery whose name is \"*\".  The response is paginated; the response header includes the offset to use in the next query.
*
* packageQuery List 
* xAuthorization String  (optional)
* offset String Provide this for pagination. If not provided, returns the first page of results. (optional)
* returns List
* */
const packagesList = ({ packageQuery, xAuthorization, offset }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        packageQuery,
        xAuthorization,
        offset,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Reset the registry
* Reset the registry to a system default state.
*
* xAuthorization String  (optional)
* no response value expected for this operation
* */
const registryReset = ({ xAuthorization }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xAuthorization,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);

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
