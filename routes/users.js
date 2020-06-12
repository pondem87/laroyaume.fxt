var express = require('express');
var passport = require('passport');
var pass_reset = require('../my_modules/pass_reset');
var content = require('../my_modules/user_content');
var aws = require('aws-sdk');
var prst = require('../my_modules/pass_reset');
var auth = require('../my_modules/auth');

var router = express.Router();

var title = process.env.SITE;

var s3 = new aws.S3();
var bucket_name = process.env.AWS_BUCKET;

/* GET users listing. */
router.get('/profile', content.get_subscriptions, function(req, res, next) {
  res.render('users/profile', {
    req: req,
    title: title
  });
});

router.get('/video-page', auth.isAuth, content.get_subscriptions, content.get_video, function(req, res, next) {
    res.render('users/video-page', {
      req: req,
      title: title,
    });
});

router.get('/stream', auth.isAuth, function(req, res, next) {
  //file to be streamed
  var file = req.query.file;
  var range = req.headers.range;

  console.log(`users: about to stream '${file}' with range '${range}'`);

  //get file information using listObjectsV2
  var params = {
    Bucket: bucket_name,
    MaxKeys: '1',
    Prefix: file
  }

  s3.listObjectsV2(params, function(error, data) {
    if (error) {
      console.log("Error in S3.listObjectsV2 call:", error.message);
      throw new Error(error.message);
    }
    //file info received
    const key = data.Contents[0].Key;
    const filesize = data.Contents[0].Size;

    if (range) {
      const parts = range.replace(/bytes=/,"").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : filesize - 1;
      const chunk_size = (end - start) + 1;

      //write headers
      res.writeHead(206, {
        'Content-Range': 'bytes ' + start + '-' + end + '/' + filesize,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunk_size,
        'Content-Type': 'video/mp4'
      });
      //create the readstream and pipe to res
      s3.getObject({
        Bucket: bucket_name,
        Key: key,
        Range: range
      }).createReadStream().pipe(res);
    } else {
      //write headers
      res.writeHead(200, {
        'Content-Length': filesize,
        'Content-Type': 'video/mp4'
      });
      //create readstream
      s3.getObject({
        Bucket: bucket_name,
        Key: key
      }).createReadStream().pipe(res);
    }
  });
});

router.get('/logout', auth.isAuth, function(req, res) {
  req.logout();
  res.redirect('/');
});

router.get('/forgot', function(req, res) {
  res.render('users/forgot', { title: title });
});

router.get('/reset', function(req, res) {
  prst.check_token(req, res);
});

router.get('/newpassword', auth.isAuth, function(req, res) {
    res.render('users/newpassword', { req: req, title: title });
});

router.get('/edit', auth.isAuth, function(req, res) {
  if (req.isAuthenticated()) {
    res.render('users/edit', { req: req, title: title });
  } else {
    res.redirect('/users/profile');
  }
});

/* POST users listing */
router.post('/login', passport.authenticate('local', {
  successRedirect: '/', failureRedirect: '/users/profile?login=failed'
}));

router.post('/genreset', function(req, res) {
  prst.generate_token(req, res);
});

router.post('/setpassword', function(req, res) {
  prst.set_password(req, res);
});

router.post('/setdetails', auth.isAuth, function(req, res, next) {
  content.set_details(req, res, next);
});

module.exports = router;
