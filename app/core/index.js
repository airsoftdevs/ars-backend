const _merge = require('lodash/merge');
const _get = require('lodash/get');
const { Router } = require('express');
const { generateRouterPath, parseYaml, getEntityName } = require('../services/utils');
const { getFiles, getFileVersion } = require('../services/files');
const controller = require('../services/controller');
const log = require('../services/log')({ file: __filename });

let models;
const configs = {},
  bootstrap = {};

/**
 * Load model.js files in directory to register in sequelize instance
 *
 * Doesn't have execution dependency
 * @param {Object} sequelize
 */
function loadModels(sequelize) {
  models = getFiles('app/entities/**/model.js').reduce((prev, file) => {
    const model = require(file)(sequelize);
    const modelName = getEntityName(file);

    prev[modelName] = model;
    log.debug(`Model "${modelName}" registered`);
    return prev;
  }, {});
}

/**
 * Load controller.js files in directory to register in app router
 * @param {Object} app
 */
function loadControllers(app) {
  getFiles('app/entities/**/controller.*', file => {
    const entity = getEntityName(file);
    const router = require(file)(Router(), models[entity]);
    const version = getFileVersion(file);
    const namespace = generateRouterPath(entity, version);

    app.use(namespace, router);
    log.debug('Custom router registered', {
      entity,
      namespace,
      version
    });
  });
}

function loadDefaultControllers(app) {
  Object.entries(models).forEach(([modelKey, model]) => {
    const schema = _get(model.getTableName(), 'schema', 'public');

    if (schema === 'public') {
      const router = controller.generateDefaultRoutes(Router(), model);

      app.use(generateRouterPath(modelKey), router);
    }
  });
}

/**
 * Load configs.yml files in directory to register in app router
 *
 * Doesn't have execution dependency
 */
function loadConfigs() {
  getFiles('app/entities/**/configs.yml', file => {
    const entity = getEntityName(file);

    configs[entity] = parseYaml(file);
    log.debug(`${entity} configs.yml file loaded`);
  });
}

/**
 * Loads relationships file and register relationships
 *
 * Depends of models
 */
function loadRelationshipsFile() {
  const filepath = 'app/entities/relationships.yml';
  const relationships = parseYaml(filepath);

  if (!relationships) return;

  Object.entries(relationships).forEach(([modelKey, modelInfo]) => {
    Object.keys(modelInfo).forEach(method => {
      modelInfo[method].forEach(params => {
        if (Array.isArray(params)) {
          const [modelToKey, opts] = params;

          models[modelKey][method](models[modelToKey], opts);
          log.debug(`${modelKey} ${method} ${modelToKey} through ${opts.foreignKey}`);
        } else {
          const modelToKey = params;

          models[modelKey][method](models[modelToKey]);
          log.debug(`${modelKey} ${method} ${modelToKey}`);
        }
      });
    });
  });
}

/**
 * Load bootstrap.yml files in directory to create endpoint
 *
 * Doesn't have execution dependency
 */
function loadBootstrapFiles() {
  getFiles('app/entities/**/bootstrap.yml', file => {
    const entity = getEntityName(file);

    bootstrap[entity] = parseYaml(file);
    log.debug('Bootstrap.yml file loaded', {
      entity
    });
  });
}

/**
 * Middleware to add context object to requests
 *
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
function addContext(req, res, next) {
  req.ctx = {};
  _merge(req.ctx, req.params);
  next();
}

/**
 * Initialize entities
 * @param {Object} app
 * @param {Object} sequelize
 */
module.exports = (app, sequelize, services = []) => {
  app.all('/api/:model', addContext);
  app.all('/api/:model/:id', addContext);
  /** Steps Execution in dependency order*/
  loadConfigs();
  loadBootstrapFiles();
  loadModels(sequelize);
  loadRelationshipsFile();
  sequelize.sync({ alter: true });

  /** start hooks before load controllers */
  services.forEach(service => service(app, models, configs));
  /** end hooks before load controllers */

  loadControllers(app);
  loadDefaultControllers(app);

  /** Needs to be moved in the future */
  app.get('/_bootstrap', (req, res) => res.send(bootstrap));
};

/**
 * Returns models instances
 * @returns {Object}
 */
module.exports.getModels = () => models;

/**
 * Returns permissions arrays
 * @returns {Array<string>}
 */
module.exports.getPermissions = () => permissions;
