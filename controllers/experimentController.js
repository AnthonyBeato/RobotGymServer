const Experiment = require('../models/Experiment');
const User = require('../models/user');
const Robot = require('../models/robot');
const mongoose = require('mongoose');

// Crear experimento
exports.createExperiment = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Obteniendo el ID del usuario desde el token JWT
        const userId = req.user._id;

        const experiment = new Experiment({ name, description, user: userId });
        await experiment.save();

        // Vincular el experimento al usuario
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.experiments.push(experiment._id);
        await user.save();

        res.status(201).json({ message: 'Experiment created successfully', experiment });
    } catch (error) {
        res.status(500).json({ message: 'Error creating experiment', error: error.message });
    }
};

// Actualizar experimento
exports.updateExperiment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, user, isActive } = req.body;

        const experiment = await Experiment.findById(id);
        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }

        experiment.name = name || experiment.name;
        experiment.description = description || experiment.description;
        experiment.user = user || experiment.user;
        experiment.isActive = isActive || experiment.isActive;

        await experiment.save();

        res.status(200).json({ message: 'Experiment updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating experiment', error: error.message });
    }
};

// Leer experimentos
exports.getExperiments = async (req, res) => {
    try {
        const experiments = await Experiment.find().populate('user');
        res.status(200).json(experiments);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving experiments', error: error.message });
    }
};

// Leer un experimento
exports.getExperiment = async (req, res) => {
    try {
        const { id } = req.params;

        const experiment = await Experiment.findById(id);
        res.status(200).json(experiment);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving experiment', error: error.message });
    }
};

// Borrar experimento
exports.deleteExperiment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid experiment ID' });
        }

        const experiment = await Experiment.findById(id);
        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }

        await Experiment.deleteOne({ _id: id });

        res.status(200).json({ message: 'Experiment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting experiment', error: error.message });
    }
};

// Iniciar experimento
exports.startExperiment = async (req, res) => {
    try {
        const { id } = req.params;
        const { robotsQuantity } = req.body;

        const experiment = await Experiment.findById(id);
        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }

        if (experiment.isActive) {
            return res.status(400).json({ message: 'Experiment is already active' });
        }

        // Buscar robots disponibles
        const availableRobots = await Robot.find({ status: 'Disponible' }).limit(robotsQuantity);
        if (availableRobots.length < robotsQuantity) {
            return res.status(400).json({ message: 'Not enough available robots' });
        }

        // Reservar robots
        const robotIds = availableRobots.map(robot => robot._id);
        await Robot.updateMany({ _id: { $in: robotIds } }, { status: 'En Uso', experiment: id });

        // Actualizar experimento 
        experiment.isActive = true;
        experiment.robots = robotIds;
        await experiment.save();

        res.status(200).json({ message: 'Experiment started successfully', experiment });
    } catch (error) {
        res.status(500).json({ message: 'Error starting experiment', error: error.message });
    }
};

// Detener experimento
exports.stopExperiment = async (req, res) => {
    try {
        const { id } = req.params;

        const experiment = await Experiment.findById(id);
        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }

        if (!experiment.isActive) {
            return res.status(400).json({ message: 'Experiment is not active' });
        }

        // Liberar robots
        await Robot.updateMany({ experiment: id }, { status: 'Disponible', experiment: null });

        // Actualizar experimento
        experiment.isActive = false;
        experiment.robots = [];
        await experiment.save();

        res.status(200).json({ message: 'Experiment stopped successfully', experiment });
    } catch (error) {
        res.status(500).json({ message: 'Error stopping experiment', error: error.message });
    }
};

// Obtener experimentos del usuario
exports.getUserExperiments = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const experiments = await Experiment.find({ user: userId }).populate('user');
        if (!experiments) {
            return res.status(404).json({ message: 'No experiments found for this user' });
        }

        res.status(200).json(experiments);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving user experiments', error: error.message });
    }
};