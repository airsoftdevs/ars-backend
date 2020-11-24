const glob = require('glob');
const fs = require('fs');
const YAML = require('yaml');
const path = require('path');
const { Router } = require('express');
const controller = require('../services/controller');
const log = require('../services/log')({ file: __filename });

let models;

/**
 * Extract entity name from folder
 * @param {string} file filepath
 * @returns {string}
 */
function getEntityName(file) {
  return file.split('/').reverse()[1];
}

/**
 * Load model.js files in directory to register in sequelize instance
 * @param {Object} sequelize
 * @returns {Promise}
 */
function loadModels(sequelize) {
  return glob.sync('app/entities/**/model.js').reduce((prev, file) => {
    const model = require(path.resolve(file))(sequelize);
    const modelName = getEntityName(file);

    prev[modelName] = model;
    log.debug(`Model "${modelName}" registered`);
    return prev;
  }, {});
}

/**
 * Load controller.js files in directory to register in app router
 * @param {Object} app
 * @param {Object} models
 */
function loadControllers(app, models) {
  glob.sync('app/entities/**/controller.js').forEach(file => {
    const entity = getEntityName(file);
    const router = require(path.resolve(file))(Router(), models[entity]);

    app.use(`/${entity}`, router);
  });
}

function loadRelationshipsFile(models) {
  const filepath = 'app/entities/relationships.yml';
  const relationships = YAML.parse(fs.readFileSync(filepath, 'utf8'));

  Object.keys(relationships).forEach(modelKey => {
    const modelInfo = relationships[modelKey];

    Object.keys(modelInfo).forEach(method => {
      if (Array.isArray(modelInfo[method])) {
        const [modelToKey, opts] = modelInfo[method];

        models[modelKey][method](models[modelToKey], opts);
      } else {
        const modelToKey = modelInfo[method];

        models[modelKey][method](models[modelToKey]);
      }
    });
  });
}

/**
 * Initialize entities
 * @param {Object} app
 * @param {Object} sequelize
 */
module.exports = (app, sequelize) => {
  models = loadModels(sequelize);

  loadRelationshipsFile(models);
  sequelize.sync({ alter: true });

  loadControllers(app, models);
  Object.keys(models).forEach(key => {
    const router = controller.generateDefaultRoutes(Router(), models[key]);

    app.use(`/${key}`, router);
  });
};

/**
 * Returns models instances
 * @returns {Object}
 */
module.exports.getModels = () => models;
