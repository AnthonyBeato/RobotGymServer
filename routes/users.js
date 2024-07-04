var express = require('express');
var router = express.Router();
const passport = require('passport');

const userController = require('../controllers/userController');
const secureRouteController = require('../controllers/secureRouteController');

/* GET users listing. */
router.get('/', userController.getAllUsers);

// Ruta para crear un nuevo usuario
router.post('/create-user', userController.createUser);

// Ruta para iniciar sesión
router.post('/login', userController.loginUser);

router.get('/protected', passport.authenticate('jwt', { session: false }), secureRouteController.protected);

// Ruta para obtener un usuario por ID
router.get('/:id', userController.getUserById);

// Ruta para actualizar un usuario
router.put('/update-user/:id', userController.updateUser);

// Ruta para eliminar un usuario
router.delete('/delete-user/:id', userController.deleteUser);

module.exports = router;
