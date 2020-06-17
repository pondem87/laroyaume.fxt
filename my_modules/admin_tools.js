var pool = require('./database').get_pool();
var str = require('@supercharge/strings');
var path = require('path');
var aws = require('aws-sdk');

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

var upadate_video = function(req, res) {

}

var delete_video = function(req, res) {
  console.log("admin_tools: delete_video: func call");
  if (!req.body.id) {
    res.json({ status: 0, response: "Delete failed! No 'id' defined"})
    return;
  }

  if (!req.body.video_src) {
    res.json({ status: 0, response: "Delete failed! No video file defined"})
    return;
  }

  var s3 = new aws.S3();
  var bucket_name = process.env.AWS_BUCKET;

  s3.deleteObject({
    Bucket: bucket_name,
    Key: req.body.video_src
  }, function(error, data) {
    if (error) {
      console.log("admin_tools: AWS object delete error:", error.message);
      res.json({ status: 0, response: "Failed to delete file from the cloud"});
      return;
    } else {
      console.log("AWS delete successful:", data);
      pool.getConnection((error, connection) => {
        if (error) {
          console.log("admin_tools: delete_video: failed to get dbase connection");
          res.json({ status: 0, response: "Failed to remove entry from database"})
          return;
        }
        var sql = 'delete from `videos` where `id` = ?';
        var values = req.body.id;
        connection.query(sql, [values], (error, results, fields) => {
          if (error) {
            console.log("admin_tools: delete_video: failed to run dbase query:", error.message);
            res.json({ status: 0, response: "Failed to remove entry from database"});
          } else {
            console.log("admin_tools: delete_video: successful");
            res.json({ status: 1, response: "Deleted video successfully"});
          }
        });
      });
    }
  });
}

module.exports = {
  insert_video: insert_video,
  get_key: get_key,
  search_videos: search_videos,
  upadate_video: upadate_video,
  delete_video: delete_video
}
