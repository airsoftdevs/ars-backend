const _isString = require('lodash/isString');
const _cloneDeep = require('lodash/cloneDeep');
const hooks = ['afterCreate', 'afterDestroy', 'afterUpdate', 'afterSave', 'afterUpsert'];
let models;

/**
 * @type {import('sequelize').Sequelize}
 */
let sequelize;

/**
 * Add a hook for services
 * @param {string} entity
 * @param {string} hook
 */
function subscribe(entity, hook) {
  if (!hooks.includes(hook)) return;

  return cb => {
    models[entity].addHook(hook, async (payload, options) => {
      await cb(_cloneDeep(payload, options));
    });
  };
}

/**
 * Create db utils over a model
 *
 * @param {import('sequelize').ModelCtor<import('sequelize').Model>} model Sequelize model
 */
function getModelHelper(model) {
  /**
   * @type {import('sequelize').ModelCtor<import('sequelize').Model>}
   */
  const _model = _isString(model) ? models[model] : model;

  return {
    /**
     * @constant
     * @type {import('sequelize').ModelCtor<import('sequelize').Model>}
     * @default
     */
    model: _model,

    /**
     * Get one item by ID
     * @param {string} id
     * @returns {Promise<import('sequelize').Model>}
     */
    get(id) {
      return _model.findOne({ where: { id } });
    },

    /**
     * Create a new row into model table
     * @param {string} id
     * @param {object} body
     * @returns {Promise<import('sequelize').Model>}
     */
    post(body) {
      return _model.create(body, { isNewRecord: true });
    },

    /**
     * Replace one row by id
     * @param {string} id
     * @param {object} body
     * @returns {Promise<import('sequelize').Model>}
     */
    update(id, body) {
      return _model
        .update(body, {
          where: {
            id
          },
          returning: true,
          individualHooks: true
        })
        .then(rows => rows[1][0]);
    },

    /**
     * Updates or create one row by id
     * @param {string} id
     * @param {object} body
     * @returns {Promise<import('sequelize').Model>}
     */
    async put(id, body, upsert = false) {
      if (upsert) {
        const obj = await _model.findOne({ where: { id } });

        if (!obj) {
          return this.post(body);
        }
      }
      return this.update(id, body);
    },

    /**
     * Update one row by id
     * @param {string} id
     * @param {object} body
     * @returns {import('sequelize').Model>}
     */
    async patch(id, body) {
      const currentData = await this.get(id);

      Object.entries(body).forEach(([key, value]) => {
        if (key === 'data') {
          currentData.patchData(value);
        } else {
          currentData[key] = value;
        }
      });

      await currentData.save();
      return currentData;
    },

    /**
     * Remove one item by ID from table
     * @param {string} id
     * @returns {Promise<import('sequelize').Model>}
     */
    delete(id) {
      return _model.destroy({ where: { id }, individualHooks: true });
    }
  };
}

/**
 * Starts a transaction
 * @param {Function} callback
 * @returns {Promise<import('sequelize').Model>}
 */
function startTransaction(cb) {
  return sequelize.transaction(cb);
}
module.exports.startTransaction = startTransaction;
module.exports.getModelHelper = getModelHelper;
module.exports.subscribe = subscribe;
module.exports.setInstances = (_models, _sequelize) => {
  models = _models;
  sequelize = _sequelize;
};
/**
 * @returns {import('sequelize').Sequelize}
 */
module.exports.getSequelize = () => sequelize;
module.exports.raw = (query, options) => sequelize.query(query, options);
