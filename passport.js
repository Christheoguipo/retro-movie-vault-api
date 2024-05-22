const passport = require("passport"),
  LocalStrategy = require("passport-local").Strategy,
  passportJWT = require("passport-jwt"),
  Models = require("./models.js");

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

/**
 * Passport Local Strategy configuration for user authentication.
 * @param {string} options.usernameField - The field name for the username in the request body.
 * @param {string} options.passwordField - The field name for the password in the request body.
 * @returns {void}
 */
passport.use(
  new LocalStrategy(
    {
      usernameField: "Username",
      passwordField: "Password",
    },
    async (username, password, callback) => {
      await Users.findOne({ Username: username })
        .then((user) => {
          if (!user) {
            return callback(null, false, {
              message: "Incorrect username or password.",
            });
          }
          if (!user.validatePassword(password)) {
            return callback(null, false, { message: "Incorrect password." });
          }

          return callback(null, user);
        })
        .catch((error) => {
          if (error) {
            return callback(error);
          }
        });
    }
  )
);

/**
 * Passport JWT Strategy configuration for user authentication.
 * @param {Function} options.jwtFromRequest - A function to extract the JWT from the request.
 * @param {string} options.secretOrKey - The secret or key for verifying the JWT.
 * @returns {void}
 */
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: "your_jwt_secret",
    },
    async (jwtPayload, callback) => {
      return await Users.findById(jwtPayload._id)
        .then((user) => {
          return callback(null, user);
        })
        .catch((error) => {
          return callback(error);
        });
    }
  )
);
