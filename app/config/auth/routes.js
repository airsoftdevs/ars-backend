const jwt = require('jsonwebtoken');
const passport = require('passport');
const _pick = require('lodash/pick');
const { authenticate } = require('../../services/auth');

/**
 * Register OAuth routes by provider
 *
 * @param {object} router
 * @param {string} provider
 */
function createRoutesByProvider(router, provider) {
  router.get(`/_auth/${provider}`, passport.authenticate(provider));
  router.get(
    `/_auth/${provider}/callback`,
    passport.authenticate(provider, { successRedirect: '/', failureRedirect: '/login' })
  );
}

/**
 * Create the callback for local authentication
 *
 * @param {string} auth
 * @param {object} req
 * @param {object} res
 */
function localCallback(auth, req, res) {
  return (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        message: info ? info.message : 'Login failed',
        user
      });
    }

    req.login(user, { session: false }, async err => {
      if (err) {
        return res.send(err);
      }
      const { id, data, email, name } = user;
      const payload = {
        id,
        data: _pick(data, ['picture', 'provider']),
        email,
        name,
        auth
      };
      const token = jwt.sign(JSON.stringify(payload), process.env.JWT_SECRET || 'your_jwt_secret');

      return res.json({ user, token });
    });
  };
}

/**
 * Create the local authentication controller for entities
 *
 * @param {string} entity
 * @returns {Function}
 */
function localController(entity) {
  return function(req, res, next) {
    return passport.authenticate(
      `local-${entity}`,
      { session: false },
      localCallback(entity, req, res, next)
    )(req, res, next);
  };
}

/**
 * Register routes on router
 *
 * @param {object} router
 */
module.exports = function(router) {
  /* POST login. */
  ['user'].forEach(entity => router.post(`/_auth/local-${entity}`, localController(entity)));
  [].forEach(provider => createRoutesByProvider(router, provider));

  router.post('/api/:model', authenticate(), (req, res, next) => {
    req.body = req.body || {};
    req.body.createdBy = req.user.id;
    next();
  });

  const serviceExp = /^\/_([a-zA-Z]*)/;

  router.all(serviceExp, (req, res, next) => {
    req.ctx = req.ctx || {};
    req.ctx.service = req.url.match(serviceExp)[1];

    if (!req.url.includes('/_auth')) {
      return authenticate(['user'])(req, res, next);
    }
    return next();
  });
};
