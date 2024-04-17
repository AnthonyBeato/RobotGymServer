const express = require('express');
const router = express.Router();
const robomakerController = require('../controllers/robomakerController');

router.post('/start-simulation', robomakerController.startSimulation);
router.post('/stop-simulation', robomakerController.stopSimulation);
router.get('/list-simulations', robomakerController.listSimulations);

module.exports = router;
