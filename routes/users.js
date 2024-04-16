var express = require('express');
var router = express.Router();
const passport = require('passport');

const userController = require('../controllers/userController');
const secureRouteController = require('../controllers/secureRouteController');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('obtener users');
});

// Ruta para registrar un nuevo usuario
router.post('/register', userController.registerUser);

// Ruta para iniciar sesión
router.post('/login', userController.loginUser);

// Ruta para cerrar sesión
router.get('/logout', userController.logoutUser);

router.get('/protected', passport.authenticate('jwt', { session: false }), secureRouteController.protected);


module.exports = router;
