var express = require('express');
var multer = require('multer');
var multerS3 = require('multer-s3');
var aws = require('aws-sdk');
var path = require('path');
var fs = require('fs');
var str = require('@supercharge/strings');
var tools = require('../my_modules/admin_tools');
var content = require('../my_modules/user_content');
var auth = require('../my_modules/auth');

var router = express.Router();

var title = process.env.SITE;

var s3 = new aws.S3();
var bucket_name = process.env.AWS_BUCKET;

/* SET UP MULTER FOR S3 UPLOAD */
var multerStore = multerS3({
  s3: s3,
  acl: 'bucket-owner-full-control',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  storageClass: 'STANDARD',
  bucket: bucket_name,
  key: function (req, file, callback) {
    tools.get_key(req, file, callback);
  }
});

var vid_upload = multer({ storage: multerStore });

/* SET UP MULTER FOR LOCAL UPLOAD */
var localStore = multer.diskStorage({
  destination: function(req, file, callback) {
    console.log("return directory name");
    callback(null, __dirname + "/../public/img/thumbnail/")
  },
  filename: function(req, file, callback) {
    var img_root = __dirname + "/../public/img/thumbnail/";
    var filename = null;
    do {
      filename = str.random(7).toUpperCase() + path.extname(file.originalname);
    } while (fs.existsSync(img_root + filename));
    console.log("return file name");
    callback(null, filename);
  }
});

var img_upload = multer({ storage: localStore });

/* GET users listing. */
router.get('/', auth.isAuthAdmin, function(req, res, next) {
  res.render('admin/index', { title: title, req: req });
});

router.get('/editpage', auth.isAuthAdmin, content.get_categories, function(req, res, next) {
  res.render('admin/editvideo', { title: title, req: req });
});

router.get('/userspage', auth.isAuthAdmin, function(req, res, next) {
  res.render('admin/users', { title: title, req: req });
});

router.get('/mail', auth.isAuthAdmin, function(req, res, next) {
  res.render('admin/mail', { title: title, req: req });
});

router.get('/uploadpage', auth.isAuthAdmin, content.get_categories, function(req, res, next) {
  res.render('admin/uploadpage', { title: title, req: req });
});

/* POST users listing */
router.post('/upload', auth.isAuthAdmin, vid_upload.single('video'), function(req, res, next) {
 tools.insert_video(req, res);
});

router.post('/searchvideos', auth.isAuthAdmin, function(req, res, next) {
  tools.search_videos(req, res);
});

router.post('/deletevideo', auth.isAuthAdmin, function(req, res, next) {
  tools.delete_video(req, res);
});

router.post('/updatevideo', auth.isAuthAdmin, img_upload.single('image'), function(req, res, next) {
  tools.update_video(req, res);
});

module.exports = router;
