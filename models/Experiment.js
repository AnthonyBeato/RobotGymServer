// models/Experiment.js
const mongoose = require('mongoose');


const experimentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    robotsQuantity: {
        type: Number,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        required: true,
    }
});

const Experiment = mongoose.model('Experiment', experimentSchema);
module.exports = Experiment; 
