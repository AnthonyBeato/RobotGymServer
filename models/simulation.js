const mongoose = require('mongoose');

const simulationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    // Relacion de la simulación con el usuario que la creó
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Referencia al modelo de usuario
        required: true
    },
});

const Simulation = mongoose.model('Simulation', simulationSchema);

module.exports = Simulation;