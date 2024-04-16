const mongoose = require('mongoose');

const robotSchema = new mongoose.Schema({
    model: String,
    status: {
        type: String,
        enum: ['disponible', 'ocupado', 'mantenimiento'],
        default: 'disponible'
    },
    // Otros atributos necesarios para tu robot
});

const Robot = mongoose.model('Robot', robotSchema);
module.exports = Robot;
