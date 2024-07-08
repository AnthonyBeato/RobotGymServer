const mongoose = require('mongoose');

const robotSchema = new mongoose.Schema({
    model: { type: String, required: true },
    status: {
        type: String,
        robotStatus: ['Disponible', 'En Uso', 'Mantenimiento'],
        default: 'Disponible'
    },
    experiment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experiment',
        default: null
    },
});

const Robot = mongoose.model('Robot', robotSchema);
module.exports = Robot;
