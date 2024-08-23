const Robot = require('../models/robot');
const mongoose = require('mongoose');
const Experiment = require('../models/Experiment');

// Obtener todos los robots
exports.getAllRobots = async (req, res) => {
    try {
        const robots = await Robot.find();
        res.status(200).json(robots);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving robots', error: error.message });
    }
};

// Obtener todos los robots disponibles
exports.getAllAvailableRobots = async () => {
    try {
        const robots = await Robot.find({ statusUse: 'Disponible' });
        return robots;
    } catch (error) {
        throw new Error('Error retrieving robots: ' + error.message);
    }
};

// Obtener un solo robot especifico
exports.getRobot = async (req, res) => {
    try {
        const { id } = req.params;

        const robot = await Robot.findById(id);
        res.status(200).json(robot);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving robot', error: error.message });
    }
};

// Obtener el estado de un robot específico
exports.getRobotStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const robot = await Robot.findById(id);
        if (!robot) {
            return res.status(404).json({ message: 'Robot not found' });
        }
        res.status(200).json({ statusUse: robot.statusUse });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving robot status', error: error.message });
    }
};

// Actualizar el estado de un robot
exports.updateRobotStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusUse } = req.body;

        const robot = await Robot.findById(id);
        if (!robot) {
            return res.status(404).json({ message: 'Robot not found' });
        }

        robot.statusUse = statusUse || robot.statusUse;
        await robot.save();

        res.status(200).json({ message: 'Robot status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating robot status', error: error.message });
    }
};

// Funcion para reservar robots para un experimento
exports.reserveRobots = async (experimentId) => {
    try {
        const experiment = await Experiment.findById(experimentId).populate('robots');

        // Poner cada robot en estado "En Uso" 
        await Robot.updateMany({ _id: { $in: experiment.robots } }, { statusUse: 'En Uso', experiment: experimentId });

        return experiment.robots;
    } catch (error) {
        throw new Error('Error retrieving robots: ' + error.message);
    }
};

// Funcion para liberar robots de un experimento
exports.releaseRobots = async (experimentId) => {
    try {
        const experiment = await Experiment.findById(experimentId).populate('robots');

        // Poner cada robot en estado "Disponible" 
        await Robot.updateMany({ _id: { $in: experiment.robots } }, { statusUse: 'Disponible', experiment: null });

        return experiment.robots;
    } catch (error) {
        throw new Error('Error retrieving robots: ' + error.message);
    }
};

// Crear un robot
exports.createRobot = async (req, res) => {
    try {
        const { model, statusUse, ip, hostname } = req.body;

        if (!model) {
            return res.status(400).json({ message: 'Model is required' });
        }

        const robot = new Robot({ model, statusUse, ip, hostname });
        await robot.save();

        res.status(201).json({ message: 'Robot created successfully', robot });
    } catch (error) {
        res.status(500).json({ message: 'Error creating robot', error: error.message });
    }
};

// Editar un robot
exports.updateRobot = async (req, res) => {
    try {
        const { id } = req.params;
        const { model, statusUse, ip, hostname } = req.body;

        const robot = await Robot.findById(id);
        if (!robot) {
            return res.status(404).json({ message: 'Robot not found' });
        }

        robot.model = model || robot.model;
        robot.statusUse = statusUse || robot.statusUse;
        robot.ip = ip || robot.ip;
        robot.hostname = hostname || robot.hostname;
        await robot.save();

        res.status(200).json({ message: 'Robot updated successfully', robot });
    } catch (error) {
        res.status(500).json({ message: 'Error updating robot', error: error.message });
    }
};

// Eliminar un robot
exports.deleteRobot = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid robot ID' });
        }

        const robot = await Robot.findById(id);
        if (!robot) {
            return res.status(404).json({ message: 'Robot not found' });
        }

        await Robot.deleteOne({ _id: id });

        res.status(200).json({ message: 'Robot deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting robot', error: error.message });
    }
};

// Conseguir robot number dado su hostname de la RPI
exports.getRobotNumber = (hostname) => {
    const match = hostname.match(/\d+/);
    return match ? match[0] : null;
};