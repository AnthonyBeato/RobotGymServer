var express = require('express');
var router = express.Router();
const passport = require('passport');

const userController = require('../controllers/userController');

/* GET users listing. */
router.get('/', userController.getAllUsers);

// Ruta para iniciar sesión
router.post('/login', userController.loginUser);

// Ruta para registrar usuario
router.post('/register', userController.createUser);

// Ruta para crear un nuevo usuario
router.post('/create-user', passport.authenticate('jwt', { session: false }), userController.createUser);

// Ruta para obtener un usuario por ID
router.get('/:id',  passport.authenticate('jwt', {session: false}), userController.getUserById);

// Ruta para actualizar un usuario
router.put('/update-user/:id', passport.authenticate('jwt', {session: false}), userController.updateUser);

// Ruta para eliminar un usuario
router.delete('/delete-user/:id', passport.authenticate('jwt', {session: false}), userController.deleteUser);

module.exports = router;
