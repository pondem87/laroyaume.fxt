var express = require('express');
var router = express.Router();

var title = process.env.SITE;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: title });
});

router.get('/about', function(req, res, next) {
  res.render('about', { title: title });
});

router.get('/contact', function(req, res, next) {
  res.render('contact', { title: title });
});

module.exports = router;
