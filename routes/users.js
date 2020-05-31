var express = require('express');
var router = express.Router();

var title = process.env.SITE;

/* GET users listing. */
router.get('/profile', function(req, res, next) {
  res.render('users/profile', { title: title });
});

router.get('/video-page', function(req, res, next) {
  res.render('users/video-page', { title: title });
});

module.exports = router;
