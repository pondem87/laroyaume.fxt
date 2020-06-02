var con_pool = require('./database').get_pool();
const str = require('@supercharge/strings');
var pw_hashing = require('./password_hashing');

module.exports.register = (req, res) => {
  con_pool.getConnection((error, connection) => {
    if (error) throw new Error(error.message);

    //get hash and salt of password_hash
    var pw = pw_hashing.gen_pword(req.body.password);

    //random unknown reset_code
    const token = str.random(30);

    var sql = 'INSERT INTO `user` (`fullname`, `email`, `hashed`, `salt`, `phone`,`active`,`admin`,`reset_code`) VALUES (?)';
    var values = [req.body.fullname, req.body.email, pw.hashed, pw.salt, req.body.phone, '1', '0', token];
    connection.query(sql, [values], (error, results, fields) => {
      if (error) {
        if (error.code == 'ER_DUP_ENTRY') {
          res.send("Email already in use. Login or reset password.");
          connection.release();
          return;
        }
        else {
          connection.release();
          throw new Error(error.message);
        }
      }

      connection.release();

      if (results.affectedRows == 1) {
        res.send("Successfully registered");
      } else {
        res.send("Unknown Error Occurred");
      }

    });
  });
};
