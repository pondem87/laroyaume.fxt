var express = require('express');
var multer = require('multer');
var multerS3 = require('multer-s3');
var aws = require('aws-sdk');
var tools = require('../my_modules/admin_tools');
var content = require('../my_modules/user_content');

var router = express.Router();

var title = process.env.SITE;

var s3 = new aws.S3();
var bucket_name = 'laroyaumfxtc.video';

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

var upload = multer({ storage: multerStore });

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('admin/index', { title: title });
});

router.get('/uploadpage', content.get_categories, function(req, res, next) {
  res.render('admin/uploadpage', { title: title, req: req });
});

/* POST users listing */
router.post('/upload', upload.single('video'), function(req, res, next) {
 tools.insert_video(req, res);
});

module.exports = router;
