var express = require('express');
var router = express.Router();

const experimentController = require('../controllers/experimentController');

// Crear experimento
router.post('/create-experiment', experimentController.createExperiment);

// Actualizar experimento
router.put('/update-experiment/:id', experimentController.updateExperiment);

// Leer experimentos
router.get('/', experimentController.getExperiments);

// Leer un experimento
router.get('/:id', experimentController.getExperiment);

// Borrar experimento
router.delete('/delete-experiment/:id', experimentController.deleteExperiment);

module.exports = router;
