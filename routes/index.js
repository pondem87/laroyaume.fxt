var express = require('express');
var content = require('../my_modules/user_content');
var register = require('../my_modules/register');
var send_mail = require('../my_modules/email').send_mail;
var router = express.Router();

var title = process.env.SITE;
var email = process.env.CONTACT_MAIL;
var app_number = process.env.CONTACT_NUMBER;

/* GET request routes */
router.get('/', content.get_categories, function(req, res, next) {
  res.render('index', {
    title: title,
    req: req
  });
});

router.get('/getvideos', function(req, res, next) {
  content.get_videolist(req, res, next);
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

router.get('/unsubscribe', function(req, res, next) {
  content.unsubscribe(req, res, next);
});

/* POST request routes */
router.post('/register', function(req, res) {
  register.register(req, res);
});

router.post('/message', (req, res) => {
  var mail = {};
  mail.to = email;
  mail.subject = req.body.name + ': ' + req.body.subject;
  mail.content = req.body.message + '\r\n\r\n' + req.body.email + ' ' + req.body.phone;
  send_mail(mail, function(success) {
    if (success) res.send("Message sent successfully!");
    else res.send("Failed to send message!");
  });
});

router.post('/subscribe', function(req, res, next) {
  content.subscribe(req, res, next);
});

module.exports = router;
