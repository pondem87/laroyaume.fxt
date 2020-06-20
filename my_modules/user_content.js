var pool = require('./database').get_pool();
var email = require('./email');
var str = require('@supercharge/strings');

const get_categories = function (req, res, next) {
  pool.getConnection((error, connection) => {
    if (error) throw new Error(error.message);

    var sql = 'select * from `categories`';
    connection.query(sql, (error, results, fields) => {
      if (error) {
        connection.release();
        throw new Error(error.message);
      }

      req.categories = results;
      connection.release();
      next();
    });
  });
};

const get_videolist = function (req, res, next) {
  var category = req.query.category ? req.query.category : 1;

  pool.getConnection((error, connection) => {
    if (error) throw new Error(error.message);

    var sql = 'select * from `videos` where `category_id` = ? and `hidden` = 0';
    var values = [category];
    connection.query(sql, values, (error, results, fields) => {
      if (error) {
        connection.release();
        res.json({status: 1, response: null});
        throw new Error(error.message);
      }
      res.json({status: 1, response: results});
      connection.release();
    });
  });
};

var get_video = function (req, res, next) {
  var id = req.query.id;

  pool.getConnection((error, connection) => {
    if (error) throw new Error(error.message);

    var sql = 'select * from `videos` where `id` = ? and `hidden` = 0';
    connection.query(sql, [id], (error, results, fields) => {
      if (error) {
        connection.release();
        throw new Error(error.message);
      }

      req.video = results[0];
      //console.log("video:", results);
      req.othervids = []
      if (req.video) {
        sql = 'select * from `videos` where `category_id` = ? and `hidden` = 0';
        connection.query(sql, [req.video.category_id], (error, results, fields) => {
          if (error) {
            connection.release();
            throw new Error(error.message);
          }

          req.othervids = results;
          connection.release();
          next();
        });
      } else {
        connection.release();
        next();
      }
    });
  });
};

var get_subscriptions = function (req, res, next) {
  if (!req.isAuthenticated()) {
    next();
    return;
  }

  pool.getConnection((error, connection) => {
    if (error) throw new Error(error.message);

    var sql = 'select * from `subscriptions_view` where `user_id` = ?';
    var values = [req.user.id];
    connection.query(sql, values, (error, results, fields) => {
      if (error) {
        connection.release();
        throw new Error(error.message);
      }

      req.user.subscriptions = results;

      sql = 'select * from `substypes`';
      connection.query(sql, (error, results, fields) => {
        if (error) {
          connection.release();
          throw new Error(error.message);
        }

        req.substypes = results;
        connection.release();
        next();
      });
    });
  });
};

var set_details = function (req, res, next) {
  var values = {};
  if (req.body.name) {
    var name = req.body.name;
    if (!/^\s+$/.test(name) && name != "")
    {
      values.fullname = name;
    }
  }
  if (req.body.email) {
    var email = req.body.email;
    if (!/^\s+$/.test(email) && email != "")
    {
      values.email = email;
    }
  }
  if (req.body.phone) {
    var phone = req.body.phone;
    if (!/^\s+$/.test(phone) && phone != "")
    {
      values.phone = phone;
    }
  }

  console.log("values = ", values);

  if (values.fullname || values.email || values.phone) {
    pool.getConnection((error, connection) => {
      if (error) next(error);

      var sql = 'update `user` set ? where `id` = ?';
      connection.query(sql, [values, req.user.id],(error, results, fields) => {
        if (error) {
          connection.release();
          next(error);
          return;
        }

        connection.release();
      });
    });
  }
  res.redirect('/');
};

var subscribe = function (req, res, next) {
  pool.getConnection((error, connection) => {
    if (error) {
      next(error);
      return;
    }

    var delcode = str.random(8);
    var sql = 'insert into `maillist` (`email`, `delcode`) values (?)';
    var values = [ req.body.email, delcode ];
    connection.query(sql, [values], (error, results, fields) => {
      if (error) {
        res.send("Could not subscribe. You may already be subscribed.");
        connection.release();
        //next(error);
        return;
      }

      connection.release();

      var mail = {};
      mail.to = req.body.email;
      mail.subject = "La Royaume FXTC News And Update Subscription";
      mail.content = "You have chosen to receive news and updates regarding La Royaume FXTC.\r\n"
       + "We will send you such content via email and your email will not be shared with anyone.\r\n"
       + "If you wish to unsubscribe, here is the link: https://" + req.hostname
       + "/unsubscribe?token=" + delcode + "\r\n";
      email.send_mail(mail, function(success) {
        if (success) res.send("Subscription successful");
        else res.send("Subscription successful but failed to send email!");
      });
    });
  });
}

var unsubscribe = function (req, res, next) {
  pool.getConnection((error, connection) => {
    if (error) {
      next(error);
      return;
    }

    var sql = 'delete from `maillist` where `delcode` = ?';
    connection.query(sql, [req.query.token], (error, results, fields) => {
      if (error) {
        res.send("<h2>Could not unsubscribe. Please contant Admin.</h2>");
        connection.release();
        next(error);
        return;
      }

      if (results.affectedRows > 0) {
        res.send("<h2>You have unsubscribed from La Royaume FXTC mail list.</h2>");
      } else {
        res.send("<h2>Unsubscribe link may have already been used. No such entry found.</h2>");
      }
      connection.release();
    });
  });
}

module.exports = {
  get_categories: get_categories,
  get_videolist: get_videolist,
  get_video: get_video,
  get_subscriptions: get_subscriptions,
  set_details: set_details,
  subscribe: subscribe,
  unsubscribe: unsubscribe
}