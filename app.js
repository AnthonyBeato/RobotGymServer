var createError = require('http-errors');
var express = require('express');
const cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport');
require('dotenv').config();


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var robotRouter = require('./routes/robots');
var experimentRouter = require('./routes/experiments')
var routineRouter = require('./routes/routines')
var queueRouter = require('./routes/queue')
var refreshTokenRouter = require('./routes/refreshToken')
var logoutRouter = require('./routes/logout')

var app = express();
// Configura CORS para permitir solicitudes desde http://localhost:5173
app.use(cors({
  origin: 'http://localhost:5173'
}));

require('./config/passport')(passport);

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
app.use('/experiments', experimentRouter)
app.use('/routines', routineRouter)
app.use('/queue', queueRouter)
app.use('/refresh-token', refreshTokenRouter)
app.use('/logout', logoutRouter)

// Middleware para parsear el cuerpo de las solicitudes
app.use(express.json());

// Inicializar Passport
app.use(passport.initialize());


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
// app.js
app.use((err, req, res) => {
  res.status(err.status || 500);
  res.render('error', {
    title: 'Error Page',
    error: err
  });
});


const mongoDBUri = process.env.MONGODB_URI;

// Ejemplo de uso en la conexión a la base de datos
const mongoose = require('mongoose');
mongoose.connect(mongoDBUri)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));


module.exports = app;
