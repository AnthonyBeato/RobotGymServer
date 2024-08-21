const mongoose = require('mongoose');

const robotSchema = new mongoose.Schema({
    model: { type: String, required: true },
    statusUse: {
        type: String,
        enum: ['Disponible', 'En Uso', 'Mantenimiento'],
        default: 'Disponible'
    },
    ip: { type: String, required: true },  
    hostname: { type: String, required: true },  
    experiment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experiment',
        default: null
    },
});

const Robot = mongoose.model('Robot', robotSchema);
module.exports = Robot;
