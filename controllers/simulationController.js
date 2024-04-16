// controllers/simulationController.js
const Simulation = require('../models/simulation');

// Crear una nueva simulación
exports.createSimulation = async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required.' });
        }
        const newSimulation = new Simulation({
            title,
            description,
            userId: req.user.userId  // Asegúrate de que el usuario esté autenticado
        });

        await newSimulation.save();
        res.status(201).json({ message: 'Simulation created successfully', simulation: newSimulation });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create simulation', error: error.message });
    }
};

// Obtener todas las simulaciones de un usuario
exports.getSimulationsByUser = async (req, res) => {
    try {
        const simulations = await Simulation.find({ userId: req.user.userId });
        res.status(200).json(simulations);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get simulations', error: error.message });
    }
};
