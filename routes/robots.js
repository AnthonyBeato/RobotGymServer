var express = require('express');
var router = express.Router();
const robotController = require('../controllers/robotController');

// /* GET robots listing. */
// router.get('/', function(req, res, next) {
//   res.send('obtener robots');
// });

// Ruta para obtener la lista de robots
router.get('/', robotController.getAllRobots);

// Ruta para obtener el estado de un robot específico
router.get('/:robotId/status', robotController.getRobotStatus);

module.exports = router;
