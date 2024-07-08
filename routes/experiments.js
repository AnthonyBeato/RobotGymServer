var express = require('express');
var router = express.Router();
const passport = require('passport');

const experimentController = require('../controllers/experimentController');

// Crear experimento
router.post('/create-experiment', passport.authenticate('jwt', {session: false}), experimentController.createExperiment);

// Actualizar experimento
router.put('/update-experiment/:id', passport.authenticate('jwt', {session: false}), experimentController.updateExperiment);

// Leer experimentos
router.get('/', passport.authenticate('jwt', {session: false}) , experimentController.getExperiments);

// Leer un experimento
router.get('/:id', passport.authenticate('jwt', {session: false}) , experimentController.getExperiment);

// Borrar experimento
router.delete('/delete-experiment/:id', passport.authenticate('jwt', {session: false}) , experimentController.deleteExperiment);

// Iniciar experimento
router.post('/start-experiment/:id', passport.authenticate('jwt', {session: false}), experimentController.startExperiment);

// Terminar experimento
router.post('/stop-experiment/:id', passport.authenticate('jwt', {session: false}), experimentController.startExperiment);

module.exports = router;
