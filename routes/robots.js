var express = require('express');
var router = express.Router();
const passport = require('passport');
const robotController = require('../controllers/robotController');

// Ruta para obtener la lista de robots
router.get('/', passport.authenticate('jwt', {session: false}), robotController.getAllRobots);

// Ruta para obtener un robot específico
router.get('/:id', passport.authenticate('jwt', {session: false}), robotController.getRobot);

// Ruta para obtener el estado de un robot específico
router.get('/:id/status', passport.authenticate('jwt', {session: false}), robotController.getRobotStatus);

// Ruta para actualizar el estado de un robot
router.put('/:id/status', passport.authenticate('jwt', {session: false}), robotController.updateRobotStatus);

// Ruta para crear un robot
router.post('/create-robot', passport.authenticate('jwt', {session: false}), robotController.createRobot);

// Ruta para editar un robot
router.put('/update-robot/:id', passport.authenticate('jwt', {session: false}), robotController.updateRobot);

// Ruta para eliminar un robot
router.delete('/delete-robot/:id', passport.authenticate('jwt', {session: false}), robotController.deleteRobot);

module.exports = router;