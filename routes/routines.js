var express = require('express');
var router = express.Router();
const passport = require('passport');
const multer = require('multer');
const routineController = require('../controllers/routineController');

// Configuración de Multer para almacenar los archivos en una carpeta temporal 'uploads/'
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // Carpeta donde se almacenarán los archivos temporalmente
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
  
  const upload = multer({ storage: storage });

// Ruta para obtener la lista de rutinas
router.get('/', passport.authenticate('jwt', {session: false}), routineController.getRoutines);

// Ruta para subir rutinas (uno o más archivos)
router.get('/:id', passport.authenticate('jwt', {session: false}), routineController.getRoutine);

// Ruta para subir una rutina
router.post('/upload', passport.authenticate('jwt', { session: false }), upload.array('files', 10), routineController.uploadRoutineFiles);

// Ruta para ejecutar una rutina específica
router.post('/run/:id', passport.authenticate('jwt', {session: false}), routineController.runRoutine);



module.exports = router;