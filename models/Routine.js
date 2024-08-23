// models/Routine.js
const mongoose = require('mongoose');


const routineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    file: {
        data: {
            type: Buffer, 
            required: true,
        },
        fileName: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
            required: true,
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    experiment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experiment',
        required: true
    },
    status: {
        type: String,
        enum: ['Ejecutandose', 'Borrador'],
        default: 'Borrador'
    },
});

const Routine = mongoose.model('Routine', routineSchema);
module.exports = Routine; 
