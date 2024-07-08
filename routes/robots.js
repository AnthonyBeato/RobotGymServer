var express = require('express');
var router = express.Router();
const passport = require('passport');
const robotController = require('../controllers/robotController');

// Ruta para obtener la lista de robots
router.get('/', passport.authenticate('jwt', {session: false}), robotController.getAllRobots);

// Ruta para obtener el estado de un robot específico
router.get('/:robotId/status', passport.authenticate('jwt', {session: false}), robotController.getRobotStatus);

// Ruta para actualizar el estado de un robot
router.put('/:robotId/status', passport.authenticate('jwt', {session: false}), robotController.updateRobotStatus);

// Ruta para reservar robots para un experimento
router.post('/reserve', passport.authenticate('jwt', {session: false}), robotController.reserveRobots);

// Ruta para crear un robot
router.post('/create-robot', passport.authenticate('jwt', {session: false}), robotController.createRobot);

// Ruta para editar un robot
router.put('/update-robot/:robotId', passport.authenticate('jwt', {session: false}), robotController.updateRobot);

// Ruta para eliminar un robot
router.delete('/delete-robot/:robotId', passport.authenticate('jwt', {session: false}), robotController.deleteRobot);

module.exports = router;
