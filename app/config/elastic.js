const path = require('path');
const fs = require('fs'),
  YAML = require('yaml');
const glob = require('glob');
const { Client } = require('@elastic/elasticsearch');
const files = require('./files');
const elastic = require('../services/elastic');
const log = require('../services/log')({ file: __filename });

/**
 * Load mapping files
 * @param {import('@elastic/elasticsearch').Client} client
 * @return {Promise}
 */
function loadMappings(client) {
  return glob.sync('app/search/mappings/*.yml').map(file => {
    const mapping = YAML.parse(fs.readFileSync(file, 'utf8'));
    const indexName = `${elastic.getIndexName(file)}_v1`;

    return client.indices.exists({ index: indexName }).then(({ body }) => {
      if (!body) {
        return client.indices.create({
          index: indexName,
          body: mapping
        });
      }
      return Promise.resolve();
    });
  });
}

/**
 * Search and requiere elastic index handlers
 */
function loadHandlers() {
  glob.sync('app/search/handlers/*.js').forEach(file => {
    require(path.resolve(file));
  });
}

module.exports = () => {
  const client = new Client({ node: process.env.ELASTIC_HOST });

  Promise.all(loadMappings(client))
    .then(r => r.forEach(log.debug))
    .catch(e => e.forEach(log.error));

  elastic.setModels(files.getModels());
  elastic.setClient(client);
  loadHandlers();
};
