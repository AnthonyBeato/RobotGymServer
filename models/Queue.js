// models/Queue.js
const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
    experiments: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Experiment' 
    }],
});

const Queue = mongoose.model('Queue', queueSchema);
module.exports = Queue;
