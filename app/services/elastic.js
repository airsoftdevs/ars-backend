const hooks = ['afterCreate', 'afterDestroy', 'afterUpdate', 'afterSave', 'afterUpsert'];
let models, client;

function subscribe(entity, hook) {
  if (!hooks.includes(hook)) return;

  return cb => {
    models[entity].addHook(hook, ({ dataValues }) => {
      cb(dataValues);
    });
  };
}

function setModels(_models) {
  models = _models;
}

/**
 * Set elastic client instance
 * @param {Object} _client
 */
function setClient(_client) {
  client = _client;
}

/**
 * Put document into elastic index
 * @param {string} index
 * @param {Object} opts
 * @param {string} opts.id
 * @param {Object} opts.data
 * @returns {Promise}
 */
function index(index, { id, data }) {
  return client.index({
    id,
    index,
    body: data
  });
}

/**
 * Resolve index name by filepath
 * @param {string} file filepath
 * @returns {string}
 */
function getIndexName(file) {
  return file
    .split('/')
    .reverse()[0]
    .split('.')[0];
}

module.exports.index = index;
module.exports.subscribe = subscribe;
module.exports.setModels = setModels;
module.exports.setClient = setClient;
module.exports.getIndexName = getIndexName;
