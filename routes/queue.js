// routes/queueRoutes.js
var express = require('express');
var router = express.Router();
const passport = require('passport');
const queueController = require('../controllers/queueController');

router.post('/add', passport.authenticate('jwt', {session: false}), queueController.addExperimentToQueue);

router.get('/first', passport.authenticate('jwt', {session: false}), queueController.getFirstExperimentInQueue);

router.delete('/remove', passport.authenticate('jwt', {session: false}), queueController.removeFirstExperimentFromQueue);

module.exports = router;
