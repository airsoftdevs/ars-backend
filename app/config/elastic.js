const { Client } = require('@elastic/elasticsearch');
const { parseYaml } = require('../services/utils');
const { getFiles } = require('../services/files');
const elastic = require('../services/elastic');
const log = require('../services/log')({ file: __filename, service: 'elastic' });

/**
 * Load mapping files
 * @param {import('@elastic/elasticsearch').Client} client
 * @return {Promise}
 */
function loadMappings(client) {
  return getFiles('app/search/mappings/*.yml').map(async file => {
    const mappingFile = parseYaml(file);
    const indexName = `${elastic.getIndexName(file)}-v1`;
    const { body: exists } = await client.indices.exists({ index: indexName });

    const response = await client.indices[!exists ? 'create' : 'putMapping']({
      index: indexName,
      body: exists ? mappingFile.mappings : mappingFile
    });

    await client.indices.putAlias({
      index: indexName,
      name: elastic.getIndexName(file)
    });
    log.debug(`Index "${indexName}" created succesfully`);

    return response;
  });
}

/**
 * Search and requiere elastic index handlers
 */
function loadHandlers() {
  getFiles('app/search/handlers/*.js', require);
}

function addRoutes(app, client) {
  app.post('/_search', async (req, res) => {
    try {
      const { body } = await client.search(req.body);

      res.send(body);
    } catch ({ meta }) {
      res.status(meta.statusCode || 400).send(meta.body);
    }
  });
}

module.exports = (app, models) => {
  if (process.env.ENABLE_ELASTIC !== 'true') return;

  try {
    const client = new Client({ node: process.env.ELASTIC_HOST });

    client.ping().then(({ body: connected, meta: { connection } }) => {
      if (connected) {
        log.info('Elasticsearch Connection has been established.', {
          url: connection.url.href
        });
      }
    });

    Promise.all(loadMappings(client))
      .then(r => r.forEach(res => log.debug(JSON.stringify(res.body))))
      .catch(e =>
        log.error(e.message, {
          reason: e.meta.body.error.reason,
          stack: e.stack
        })
      );

    elastic.setModels(models);
    elastic.setClient(client);
    loadHandlers();
    addRoutes(app, client);
  } catch (error) {
    log.error(error.message);
  }
};
