var pool = require('./database').get_pool();

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
  req.category = category;

  pool.getConnection((error, connection) => {
    if (error) throw new Error(error.message);

    var sql = 'select * from `videos` where `category_id` = ? and `hidden` = 0';
    var values = [category];
    connection.query(sql, values, (error, results, fields) => {
      if (error) {
        connection.release();
        throw new Error(error.message);
      }

      req.videos = results;
      console.log("videos:", results);
      req.pages = Math.trunc(req.videos.length/6) + 1;
      connection.release();
      next();
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
      console.log("video:", results);
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

module.exports = {
  get_categories: get_categories,
  get_videolist: get_videolist,
  get_video: get_video,
  get_subscriptions: get_subscriptions,
  set_details: set_details
}
