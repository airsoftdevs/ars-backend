const { Sequelize } = require('sequelize');
const log = require('../services/log')({ file: __filename });

module.exports = async () => {
  const sequelize = new Sequelize('postgres://user:pass@127.0.0.1:5432/poc', {
    logging: false
  });

  try {
    await sequelize.authenticate();
    log.info('Connection has been established successfully.');
  } catch (error) {
    log.error('Unable to connect to the database:', error);
  }

  return sequelize;
};
