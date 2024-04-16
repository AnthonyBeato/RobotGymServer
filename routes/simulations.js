var express = require('express');
var router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const dataController = require('../controllers/dataController');
const simulationController = require('../controllers/simulationController');


// /* GET simulations listing. */
// router.get('/', function(req, res, next) {
//   res.send('respond with a resource');
// });

router.get('/protected-data', authenticateToken, dataController.getProtectedData);

// Ruta para crear una simulación
router.post('/', authenticateToken, simulationController.createSimulation);

// Ruta para obtener las simulaciones del usuario 
router.get('/', authenticateToken, simulationController.getSimulationsByUser);

module.exports = router;
