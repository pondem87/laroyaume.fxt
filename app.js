var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var database = require('./my_modules/database');
var passport = require('passport');
const session = require('express-session');
const MysqlStore = require('express-mysql-session')(session);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//**********setup session storage***********************************************
const sessionStore = new MysqlStore({}, database.get_pool());
//setup the session middleware with above storage
app.use(session({
    key: 'la-royaume',
    secret: 'Hjnj%OPk_jhsgb7yuix7HHGgvcH',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge : 5400000 }
}));

//*********import passport configuration and initialize*************************
require('./my_modules/passport_config');
app.use(passport.initialize());
app.use(passport.session());

//setup routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = process.env.ENV === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
