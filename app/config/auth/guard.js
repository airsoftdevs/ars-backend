const { authenticate } = require('../../services/auth');
const { generateRouterPath } = require('../../services/utils');
const log = require('../../services/log')({ file: __filename });

/**
 * Set auth middleware to protect endpoints
 *
 * @param {object} app
 * @param {object} schemas
 * @param {string} rootPath
 */
module.exports = (app, schemas, configs) => {
  const schemaList = Object.keys(schemas),
    routes = [
      { method: 'get' },
      { method: 'post' },
      { method: 'get', param: 'id' },
      { method: 'put', param: 'id' },
      { method: 'patch', param: 'id' },
      { method: 'delete', param: 'id' }
    ];

  schemaList.forEach(schemaName => {
    const schemaAuthConfig = (configs[schemaName] && configs[schemaName].auth) || {};

    if (schemaAuthConfig) {
      routes.forEach(({ method, param }) => {
        if (schemaAuthConfig[method] !== false) {
          if (param) {
            return app[method](`${generateRouterPath(schemaName)}/:${param}`, authenticate());
          } else {
            return app[method](generateRouterPath(schemaName), authenticate());
          }
        }
        log.debug('auth guard omitted', {
          model: schemaName,
          method
        });
      });
    }
  });
};
