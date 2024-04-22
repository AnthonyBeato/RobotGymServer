// models/Session.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    vncPort: {
        type: Number,
        required: true
    },
    wsPort: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Session', sessionSchema);
