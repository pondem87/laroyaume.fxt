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

module.exports = {
  get_categories: get_categories,
  get_videolist: get_videolist,
  get_video: get_video
}
