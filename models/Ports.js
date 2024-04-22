// models/Port.js
const mongoose = require('mongoose');

const portSchema = new mongoose.Schema({
    portNumber: {
        type: Number,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        enum: ['VNC', 'WebSocket']
    },
    inUse: {
        type: Boolean,
        default: false
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session'
    }
});

module.exports = mongoose.model('Port', portSchema);
