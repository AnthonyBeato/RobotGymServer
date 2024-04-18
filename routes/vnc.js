const express = require('express');
const router = express.Router();
const vncController = require('../controllers/vncController');

// Ruta para crear una sesión VNC
router.post('/create-session', vncController.createSession);

// Ruta para cerrar una sesión VNC
router.post('/close-session', vncController.closeSession);

module.exports = router;
