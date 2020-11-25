const passport = require('passport');

/**
 * Add authentication middleware
 * @returns {Function}
 */
function authenticate() {
  return (req, res, next) => {
    req.ctx = req.ctx || {};
    passport.authenticate('jwt', { session: false })(req, res, next);
  };
}

/**
 * Checks if provided token is valid
 *
 * @param {string} token JTW Token
 * @returns {Promise}
 */
function authenticateWithToken(token) {
  return new Promise((resolve, reject) => {
    const req = {
        headers: {
          authorization: `Bearer ${token}`
        },
        logIn(user) {
          resolve(user);
        }
      },
      res = {
        send: {},
        end(status) {
          reject(new Error(status));
        }
      };

    authenticate()(req, res, () => {});
  });
}

exports.authenticate = authenticate;
exports.authenticateWithToken = authenticateWithToken;
