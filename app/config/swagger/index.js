const _ = require('lodash');
const swaggerUi = require('swagger-ui-express');
const pkg = require('../../../package.json');
const { parseYaml, getEntityName } = require('../../services/utils');
const { getFiles } = require('../../services/files');

const swaggerDocument = parseYaml(`${__dirname}/openapi.yml`);

_.set(swaggerDocument, 'info.description', pkg.description);
_.set(swaggerDocument, 'info.version', pkg.version);

function loadFiles(models) {
  getFiles('app/entities/**/swagger.*').forEach(file => {
    const swaggerFile = parseYaml(file);
    const entity = getEntityName(file);
    const route = `/${entity}`;
    const model = models[entity];
    const modelName = [model.name, model.getTableName()];

    Object.keys(swaggerFile.paths || {}).forEach(key => {
      const path = swaggerFile.paths[key];
      const namespace = `${route}${key}`.replace(/\/$/, '');

      path.tags = [modelName[1]];
      delete swaggerFile.paths[key];

      swaggerFile.paths[namespace] = path;
    });

    _.merge(swaggerDocument, swaggerFile);
  });
}

function defaultDefinition(modelName) {
  const referenceFile = JSON.stringify(parseYaml(`${__dirname}/default-definitions.yml`));

  return JSON.parse(
    referenceFile
      .replace(/<Plural>/g, modelName[1])
      .replace(/<plural>/g, modelName[1].toLocaleLowerCase())
      .replace(/<Singular>/g, modelName[0])
      .replace(/<singular>/g, modelName[0].toLocaleLowerCase())
  );
}

function addDefaultDefinitions(models) {
  Object.keys(models).forEach(entity => {
    const model = models[entity];
    const modelName = [model.name, model.getTableName()];

    _.merge(swaggerDocument, defaultDefinition(modelName));
  });
}

module.exports = (app, models) => {
  addDefaultDefinitions(models);
  loadFiles(models);

  app.use('/_docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
