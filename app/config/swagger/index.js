const _ = require('lodash');
const swaggerUi = require('swagger-ui-express');
const pkg = require('../../../package.json');
const { parseYaml, getEntityName } = require('../../services/utils');
const { getFiles } = require('../../services/files');

const swaggerDocument = parseYaml(`${__dirname}/openapi.yml`);

_.set(swaggerDocument, 'info.description', pkg.description);
_.set(swaggerDocument, 'info.version', pkg.version);

module.exports = app => {
  getFiles('app/entities/**/swagger.*').forEach(file => {
    const swaggerFile = parseYaml(file);
    const entity = getEntityName(file);
    const namespace = `/${entity}`;

    Object.keys(swaggerFile.paths).forEach(key => {
      const path = swaggerFile.paths[key];

      delete swaggerFile.paths[key];

      swaggerFile.paths[`${namespace}${key}`] = path;
    });

    _.merge(swaggerDocument, swaggerFile);
  });

  app.use('/_docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
