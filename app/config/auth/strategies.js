const LocalStrategy = require('passport-local').Strategy,
  bcrypt = require('bcrypt'),
  ExtractJWT = require('passport-jwt').ExtractJwt,
  JWTStrategy = require('passport-jwt').Strategy;

module.exports = models => {
  function localStrategyHandler(model) {
    return (email, password, done) => {
      const UserModel = models[model];

      // Assume there is a DB module providing a global UserModel
      return UserModel.findOne({ where: { email } })
        .then(user => {
          if (!user) {
            return done(null, false, { message: 'Account not found.' });
          }

          if (!bcrypt.compareSync(password, user.password)) {
            return done(null, false, { message: 'Wrong password.' });
          }

          return done(null, user, {
            message: 'Logged In Successfully'
          });
        })
        .catch(err => {
          return done(err);
        });
    };
  }

  async function jwtFunc(req, jwtPayload, done) {
    if (jwtPayload.isBot) {
      return done(null, jwtPayload);
    }

    req.ctx = req.ctx || {};

    if (req.user) {
      return done(null, req.user);
    }

    const UserModel = models['user'];

    // find the user in db if needed
    try {
      const user = await UserModel.findOne({ where: { id: jwtPayload.id } });

      return done(null, user);
    } catch (error) {
      return done(error, false, { message: 'Unauthorized' });
    }
  }

  const localStrategies = ['user'].map(model => [
    `local-${model}`,
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },
      localStrategyHandler(model)
    )
  ]);

  const jwtStrategy = [
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret',
        passReqToCallback: true
      },
      jwtFunc
    )
  ];

  return [...localStrategies, jwtStrategy];
};
