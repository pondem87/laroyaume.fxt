const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const con_pool = require('./database').get_pool();
const pw_hashing = require('./password_hashing');

const customFields = {
  usernameField : 'email',
  passwordField : 'password'
}

const verifyCallback = (username, password, done) => {
  con_pool.getConnection((error, connection) => {
    if (error) throw error;

    var sql = 'select * from `user` where `email` = ? and `active` = 1';
    connection.query(sql, [username], (error, results, fields) => {
      if (error) {
        connection.release();
        throw error;
      }

      if (!results[0]) return done(null, false);
      user = results[0];

      var is_valid = pw_hashing.is_password_valid(password, user.hashed, user.salt);
      if (is_valid) {
        return done(null, user);
      }
      else {
        return done(null, false);
      }
    });
  });
}

const strategy = new LocalStrategy(customFields, verifyCallback);

passport.use(strategy);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((user_id, done) => {
  con_pool.getConnection((error, connection) => {
    if (error) throw error;

    var sql = 'select * from `user` where `id` = ? and `active` = 1'
    connection.query(sql, [user_id], (error, results, fields) => {
      if (error) {
        connection.release();
        throw error;
      }

      connection.release();
      done(null, results[0]);
    });
  });
});

console.log("passport_config: initialisation done.");

module.export = passport;
