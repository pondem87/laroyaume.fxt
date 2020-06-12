var isAuth = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/users/profile');
  }
}

var isAuthAdmin = function (req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user.admin == '1') {
      next();
    } else {
      res.locals.message = "You are not authorized to open this page!!!";
      var error = { status: 401, stack: "Not authorised. Contact webmaster for more information." };
      res.locals.error = error;
      res.render("error");
    }
  } else {
    res.redirect('/users/profile');
  }
}

module.exports = {
  isAuth: isAuth,
  isAuthAdmin: isAuthAdmin
}
