const Robot = require('../models/robot');
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

// Obtener el estado de un robot específico
exports.getRobotStatus = async (req, res) => {
    try {
        const { robotId } = req.params;
        const robot = await Robot.findById(robotId);
        if (!robot) {
            return res.status(404).json({ message: 'Robot not found' });
        }
        res.status(200).json({ status: robot.status });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving robot status', error: error.message });
    }
};

// Actualizar el estado de un robot
exports.updateRobotStatus = async (req, res) => {
    try {
        const { robotId } = req.params;
        const { status } = req.body;

        const robot = await Robot.findById(robotId);
        if (!robot) {
            return res.status(404).json({ message: 'Robot not found' });
        }

        robot.status = status || robot.status;
        await robot.save();

        res.status(200).json({ message: 'Robot status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating robot status', error: error.message });
    }
};

// Reservar robots para un experimento
exports.reserveRobots = async (req, res) => {
    try {
        const { experimentId, robotsQuantity } = req.body;

        const experiment = await Experiment.findById(experimentId);
        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }

        if (experiment.isActive) {
            return res.status(400).json({ message: 'Experiment is already active' });
        }

        const availableRobots = await Robot.find({ status: 'Disponible' }).limit(robotsQuantity);
        if (availableRobots.length < robotsQuantity) {
            return res.status(400).json({ message: 'Not enough available robots' });
        }

        const robotIds = availableRobots.map(robot => robot._id);
        await Robot.updateMany({ _id: { $in: robotIds } }, { status: 'En Uso', experiment: experimentId });

        experiment.isActive = true;
        experiment.robots = robotIds;
        await experiment.save();

        res.status(200).json({ message: 'Robots reserved successfully', experiment });
    } catch (error) {
        res.status(500).json({ message: 'Error reserving robots', error: error.message });
    }
};

// Crear un robot
exports.createRobot = async (req, res) => {
    try {
        const { model, status } = req.body;

        if (!model) {
            return res.status(400).json({ message: 'Model is required' });
        }

        const robot = new Robot({ model, status });
        await robot.save();

        res.status(201).json({ message: 'Robot created successfully', robot });
    } catch (error) {
        res.status(500).json({ message: 'Error creating robot', error: error.message });
    }
};

// Editar un robot
exports.updateRobot = async (req, res) => {
    try {
        const { robotId } = req.params;
        const { model, status } = req.body;

        const robot = await Robot.findById(robotId);
        if (!robot) {
            return res.status(404).json({ message: 'Robot not found' });
        }

        robot.model = model || robot.model;
        robot.status = status || robot.status;
        await robot.save();

        res.status(200).json({ message: 'Robot updated successfully', robot });
    } catch (error) {
        res.status(500).json({ message: 'Error updating robot', error: error.message });
    }
};

// Eliminar un robot
exports.deleteRobot = async (req, res) => {
    try {
        const { robotId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(robotId)) {
            return res.status(400).json({ message: 'Invalid robot ID' });
        }

        const robot = await Robot.findById(robotId);
        if (!robot) {
            return res.status(404).json({ message: 'Robot not found' });
        }

        await Robot.deleteOne({ _id: robotId });

        res.status(200).json({ message: 'Robot deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting robot', error: error.message });
    }
};
