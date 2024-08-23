// controllers/queueController.js
const Queue = require('../models/Queue');

// Añadir un experimento a la cola
exports.addExperimentToQueue = async (req, res) => {
    const { experimentId } = req.body;

    try {
        const queue = await Queue.findOne({});
        if (!queue) {
            // Si no existe una cola, crea una nueva
            const newQueue = new Queue({ experiments: [experimentId] });
            await newQueue.save();
        } else {
            queue.experiments.push(experimentId);
            await queue.save();
        }
        res.status(200).json({ message: 'Experiment added to the queue' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding the experiment to the queue', error });
    }
};

// Obtener el primer experimento en la cola
exports.getFirstExperimentInQueue = async (req, res) => {
    try {
        const queue = await Queue.findOne({}).populate('experiments');
        if (!queue || queue.experiments.length === 0) {
            return res.status(404).json({ message: 'The queue is empty' });
        }
        res.status(200).json(queue.experiments[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error obtaining the first experiment in the queue', error });
    }
};

// Eliminar el primer experimento de la cola (después de que termine)
exports.removeFirstExperimentFromQueue = async (req, res) => {
    try {
        const queue = await Queue.findOne({});
        if (!queue || queue.experiments.length === 0) {
            return res.status(404).json({ message: 'The queue is empty' });
        }
        queue.experiments.shift();
        await queue.save();
        res.status(200).json({ message: 'First experiment delete from the queue' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting the first experiment from the queue', error });
    }
};
