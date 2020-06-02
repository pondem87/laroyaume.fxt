var express = require('express');
var register = require('../my_modules/register')
var router = express.Router();

var title = process.env.SITE;
var email = process.env.CONTACT_MAIL;
var app_number = process.env.CONTACT_NUMBER;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: title });
});

router.get('/about', function(req, res, next) {
  res.render('about', { title: title });
});

router.get('/contact', function(req, res, next) {
  res.render('contact', {
    title: title,
    email: email,
    app_number: app_number
  });
});

router.post('/register', function(req, res) {
  register.register(req, res);
});

module.exports = router;
