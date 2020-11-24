const bcrypt = require('bcrypt');

function postMiddleware(req, res, next) {
  if (!req.body.password) next();
  return bcrypt.genSalt(10).then(salt => {
    bcrypt.hash(req.body.password, salt).then(hash => {
      req.body.password = hash;
      req.body.saltSecret = salt;
      next();
    });
  });
}

module.exports = router => {
  router.post('/', postMiddleware);

  return router;
};
