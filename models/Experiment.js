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
    robots: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Robot' 
    }],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    startTime: {
        type: Date, 
        default: Date.now,
    }
});

const Experiment = mongoose.model('Experiment', experimentSchema);
module.exports = Experiment; 
