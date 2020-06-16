var pool = require('./database').get_pool();
var str = require('@supercharge/strings');
var path = require('path');

var get_key = function (req, file, callback) {
  var key = str.random(8).toUpperCase() + path.extname(file.originalname);
  pool.getConnection((error, connection) => {
    if (error) throw error;

    var sql = 'select * from `videos` where `video_src` = ?'
    var values = [key];
    connection.query(sql, [values], (error, results, fields) => {
      if (error) {
        connection.release();
        throw error;
      }

      if (results.length > 0) {
        connection.release();
        get_key(req, file, callback);
      } else {
        connection.release();
        console.log("admin_tools: get_key: returning key");
        req.key = key;
        callback(null, key);
      }
    });
  });
};

var insert_video = function (req, res) {
  console.log("admin_tools: called the inset_video function")
  pool.getConnection((error, connection) => {
    if (error) throw error;

    var sql = 'insert into `videos` (`title`, `summary`, `thumbnail`, `video_src`, `category_id`, `hidden`) values (?)';
    var values = [req.body.title, req.body.summary, '/img/thumbnail/video1.jpg', req.key, req.body.category, 0];
    connection.query(sql, [values], (error, results, fields) => {
      if (error) {
        connection.release();
        throw error;
      }
      connection.release();
      console.log("admin_tools: inset_video: database updated")
      res.send("\"" + req.body.title + "\" : video Uploaded");
    });
  });
};

var search_videos = function(req, res) {
  console.log("admin_tools: called the search_videos function");
  pool.getConnection((error, connection) => {
    if (error) {
      console.log("admin_tools: search_videos: error on getConnection");
      res.json([]);
      return;
    }

    var sql = null;
    var values = null;

    if (req.body.category_id) {
      sql = 'select * from `videos` where `category_id` = ?';
      values = req.body.category_id;
    } else if (req.body.title) {
      sql = 'select * from `videos` where `title` like ?';
      values = '%' + req.body.title + '%';
    } else {
      res.json([]);
      return;
    }

    connection.query(sql, [values], (error, results, fields) => {
      if (error) {
        console.log("admin_tools: search_videos: error on querying connection");
        res.json([]);
        return;
      }
      connection.release();
      console.log("admin_tools: search_videos: query ran succesfully");
      res.json(results);
    });
  });
}

module.exports = {
  insert_video: insert_video,
  get_key: get_key,
  search_videos: search_videos
}
