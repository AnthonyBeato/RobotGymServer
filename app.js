var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport');
require('dotenv').config();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var robotRouter = require('./routes/robots');
var simulationRouter = require('./routes/simulations');
var vncRouter = require('./routes/vnc');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/robots', robotRouter);
app.use('/simulations', simulationRouter);
app.use('/api/vnc', vncRouter);

// Middleware para parsear el cuerpo de las solicitudes
app.use(express.json());

// Inicializar Passport
app.use(passport.initialize());

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const mongoDBUri = process.env.MONGODB_URI || 4000;

// Ejemplo de uso en la conexión a la base de datos
const mongoose = require('mongoose');
mongoose.connect(mongoDBUri)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));


module.exports = app;
