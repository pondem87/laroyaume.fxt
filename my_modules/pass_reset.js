const str = require('@supercharge/strings');
const mailer = require('./email');
const pool = require('./database').get_pool();
const phash = require('./password_hashing')

var title = process.env.SITE;

const generate_token = (req, res) => {
  console.log("pass_reset: generate_token fxn called.");
  if (req.body.email == undefined) {
    res.send("Email field not defined.");
    return;
  }

  const token = str.random(20);
  const hash = phash.gen_hash(token);

  pool.getConnection((error, connection) => {
    if (error) throw new Error(error.message);

    var sql = 'update `user` set `reset_code` = ? where `email` = ?';
    var values = [hash, req.body.email];
    connection.query(sql, values ,(error, results, fields) => {
      if (error) {
        connection.release();
        throw new Error(error.message);
      }

      console.log("pass_reset: dbase update query result:", results);

      if (results.changedRows == 0) {
        connection.release();
        res.send({text:"User with provided email does not exist!"});
      } else {
        connection.release();
        console.log("pass_reset: generating and sending email to: ", req.body.email);
        var mail = {};
        mail.to = req.body.email;
        mail.subject = "La Royaume FXTC: Password Reset"
        mail.content = "You requested password reset. Follow the link below to reset your password.\r\n"
          + "https://" + req.hostname + '/users/reset?token=' + token + "\r\n";
        mailer.send_mail(mail, (result) => {
          if (result) {
            res.send({text:"Email sent to your inbox. Login to your email and follow the link that was sent. Check spam folder if you cannot find it"});
          } else {
            res.send({text:"Failed to send reset email. Contact us for assistance"});
          }
        });
      }
    });
  });
};

const check_token = (req, res) => {
  if (req.query.token == undefined) throw new Error("No token defined for password reset`");

  pool.getConnection((error, connection) => {
    if (error) throw new Error(error.message);

    var hash = phash.gen_hash(req.query.token);

    sql = 'select * from `user` where `reset_code` = ?';
    connection.query(sql, hash, (error, results, fields) => {
      if (error) {
        connection.release();
        throw new Error(error.message);
      }

      if (results.length == 1) {
        res.render('users/newpassword', { req: req, title: title });
      } else {
        res.locals.message = "Invalid rest token. Try resetting again";
        var error = { status: 500, stack: "Custom error message" };
        res.locals.error = error;
        res.render("error");
      }
      connection.release();
    });
  });
};

const set_password = (req, res) => {
  console.log("pass_reset: set_password fxn called.");
  pool.getConnection((error, connection) => {
    if (error) throw new Error(error.message);

    const token = str.random(30);

    var pw = phash.gen_pword(req.body.password);
    var hash = phash.gen_hash(req.body.token);
    var values = [pw.hashed, pw.salt, token, hash];
    var sql = 'update `user` set `hashed` = ?, `salt` = ?, `reset_code` = ? where `reset_code` = ?';
    connection.query(sql, values, (error, results, fields) => {
      if (error) {
        connection.release();
        res.locals.message = error.message;
        var error = { status: 500, stack: "Custom error message" };
        res.locals.error = error;
        res.render("error");
        return;
      }

      if (results.changedRows == 1) {
        res.redirect('/');
      } else {
        res.locals.message = "Password cannot be set";
        var error = { status: 500, stack: "Custom error message" };
        res.locals.error = error;
        res.render("error");
      }
    });
  });
};

module.exports = {
  generate_token: generate_token,
  check_token: check_token,
  set_password: set_password
}
