const passport = require('passport'),
  routes = require('./routes'),
  guard = require('./guard'),
  defaultStrategies = require('./strategies');

/**
 * Register strategies in the passport instance
 * @param {Array} strategies
 */
function registerStrategies(strategies = []) {
  strategies.forEach(strategy => {
    const [name, handler] = strategy;

    passport.use(name, handler);
  });
}

module.exports = (app, models, configs = {}) => {
  const strategies = defaultStrategies(models);

  registerStrategies(strategies);
  routes(app);
  guard(app, models, configs);
};
