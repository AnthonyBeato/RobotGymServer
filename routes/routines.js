var express = require('express');
var router = express.Router();
const passport = require('passport');
const multer = require('multer');
const routineController = require('../controllers/routineController');

// Configuración de Multer para trabajar en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Ruta para obtener la lista de rutinas
router.get('/', passport.authenticate('jwt', {session: false}), routineController.getRoutines);

// Ruta para subir rutinas (uno o más archivos)
router.get('/:id', passport.authenticate('jwt', {session: false}), routineController.getRoutine);

// Ruta para subir una rutina
router.post('/upload', passport.authenticate('jwt', { session: false }), upload.single('file'), routineController.uploadRoutineFiles);

// Ruta para ejecutar una rutina específica
router.post('/run/:id', passport.authenticate('jwt', {session: false}), routineController.runRoutine);

// Ruta para detener una rutina específica 
router.post('/stop-routine', passport.authenticate('jwt', { session: false }), routineController.stopRoutine);


module.exports = router;