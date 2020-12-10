const _ = require('lodash');
const { Sequelize, Op } = require('sequelize');
const { setInstances } = require('../services/db');
const log = require('../services/log')({ file: __filename, service: 'postgres' });

let sequelize;

async function init() {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: msg => log.silly(msg),
    dialectOptions: {
      useUTC: false
    },
    timezone: '-04:00'
  });

  try {
    await sequelize.authenticate();
    log.info('PostgreSQL Connection has been established.', {
      uri: process.env.DATABASE_URL
    });
  } catch (error) {
    log.error('Unable to connect to the database:', error);
  }

  return sequelize;
}

/**
 * Add custom methods to sequelize model instance
 * @param {object} models Object that contains all models registered
 */
function addCustomMethods(models) {
  Object.keys(models).forEach(key => {
    const model = models[key];

    model.prototype.populate = async function({ path, ref, select, populate }) {
      try {
        const values = _.get(this, path);
        const propIsArray = _.isArray(values);
        const rows = await models[ref].findAll({
          attributes: select,
          where: { id: { [Op.in]: propIsArray ? values : [values] } }
        });

        if (populate) {
          for (row of rows) {
            await row.populate(populate);
          }
        }

        _.set(this, path, propIsArray ? rows : rows[0]);
      } catch (error) {
        log.error(error.message);
      }
      return this;
    };

    model.prototype.patchData = function(payload) {
      this.data = {
        ...this.data,
        ...payload
      };
    };
  });
}

function loadService(app, models) {
  setInstances(models, sequelize);
  addCustomMethods(models);
}

module.exports = loadService;
/**
 * @returns {import('sequelize').Sequelize}
 */
module.exports.getClient = () => sequelize;
module.exports.init = init;
