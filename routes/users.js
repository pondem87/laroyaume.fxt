var express = require('express');
var passport = require('passport');
var pass_reset = require('../my_modules/pass_reset');
var router = express.Router();

var title = process.env.SITE;


/* GET users listing. */
router.get('/profile', function(req, res, next) {
  res.render('users/profile', {
    req: req,
    title: title
  });
});

router.get('/video-page', function(req, res, next) {
  res.render('users/video-page', {
    req: req,
    title: title
  });
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
})

/* POST users listing */
router.post('/login', passport.authenticate('local', {
  successRedirect: '/', failureRedirect: '/users/profile?login=failed'
}));

module.exports = router;
