const Experiment = require('../models/Experiment');
const User = require('../models/user');
const Robot = require('../models/robot');
const mongoose = require('mongoose');
const execSshRosCommand = require('./helpers/execSshRosCommand');
// const fs = require('fs');
const path = require('path');
const robotController = require('../controllers/robotController');
const execSshCommand = require('./helpers/execSshCommand');

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
// Almacenar temporizadores por experiment ID
const timers = {};
// Iniciar experimento
exports.startExperiment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid experiment ID' });
        }

        // Verificar si ya hay un experimento en ejecución
        const activeExperiment = await Experiment.findOne({ isActive: true });
        if (activeExperiment) {
            return res.status(400).json({ message: 'An experiment is already running. Please stop the current experiment before starting a new one.' });
        }

        const experiment = await Experiment.findById(id);
        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }

        if (experiment.isActive) {
            return res.status(400).json({ message: 'Experiment is already active' });
        }

        // Verificar la disponibilidad real de los robots
        try{
            const availableRobots = await runManualControl();

            if (availableRobots.length === 0 ){
                return res.status(400).json({ message: 'They arent any robots available for the experiment' });
            }
            // Actualizar el experimento para reflejar que está activo y asignarle los robots
            experiment.isActive = true;
            experiment.startTime = Date.now(); 
            experiment.robots = availableRobots;
            await experiment.save();
    
            await robotController.reserveRobots(experiment._id);

            // Iniciar Camara
            await activateCamera();

            // Iniciando un timer de 2 horas
            if (timers[id]) {
                clearTimeout(timers[id]);
            }
            timers[id] = setTimeout(async () => {
                await exports.stopExperiment({ params: { id } }, res);
                console.log(`Experiment ${id} stopped after 2 hours`);
            }, 2 * 60 * 60 * 1000); // 2 horas en milisegundos
    
            console.log('Experiment started successfully');
            res.status(200).json({ message: 'Experiment started successfully', experiment });

        } catch (runError){
            return res.status(500).json({ message: 'Error starting experiment', error: runError.message });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error starting experiment', error: error.message });
    }
};

async function activateCamera(){
    const cameraIp = 'rpicamera1';
    const privateKeyPath  = path.join(process.env.HOME, '.ssh', 'id_rsa');

    const cameraCommand = 'nohup python3 ~/Documents/camera/stream_camera.py > ~/camera.log 2>&1 & echo $! > ~/camera.pid';
    await execSshCommand(cameraIp, 'robotgym',  privateKeyPath, cameraCommand);
            console.log("camera loaded");
}

async function runManualControl() {
    const availableRobots = [];
    const robots = await Robot.find({ statusUse: 'Disponible' });

    const privateKeyPath  = path.join(process.env.HOME, '.ssh', 'id_rsa');

    const robotPromises = robots.map(async (robot) => {
        try {
            console.log(`Iniciando el chequeo de salud para ${robot.model} en ${robot.ip}`);

            // Inicia los nodos de heartbeat y diagnostics en segundo plano
            execSshRosCommand(robot.ip, 'robot',  privateKeyPath, 'nohup ros2 run health_check_pkg heartbeat_publisher_node > ~/heartbeat.log 2>&1 & echo $! > ~/heartbeat.pid', 'robot_ws');
            console.log("heartbeat loaded");

            execSshRosCommand(robot.ip, 'robot', privateKeyPath, 'nohup ros2 run health_check_pkg diagnostics_publisher_node > ~/diagnostics.log 2>&1 & echo $! > ~/diagnostics.pid',  'robot_ws');
            console.log("diagnostics loaded");

            // Start rosbridge and capture all related PIDs
            execSshRosCommand(robot.ip, 'robot',  privateKeyPath, 'nohup ros2 launch rosbridge_server rosbridge_websocket_launch.xml > ~/rosbridge.log 2>&1 & echo $! > ~/rosbridge.pid',  'robot_ws');
            execSshRosCommand(robot.ip, 'robot',  privateKeyPath, 'pgrep -P $(cat ~/rosbridge.pid) > ~/rosbridge_children.pids',  'robot_ws');
            console.log("rosbridge loaded");

            // Start diffbot and capture all related PIDs
            execSshRosCommand(robot.ip, 'robot', privateKeyPath, 'nohup ros2 launch diffdrive_msp432 diffbot.launch.py > ~/diffbot.log 2>&1 & echo $! > ~/diffbot.pid',  'robot_ws');
            console.log("diffbot loaded");

            // Agregar el robot a la lista de disponibles si todo fue bien
            availableRobots.push(robot._id);

            await robot.updateOne({statusUse: "En Uso"});

        } catch (error) {
            console.error(`Error while setup the robot: ${robot.model} (${robot.ip}):`, error);
            // Cambia el estado del robot a "Mantenimiento" si no responde
            await Robot.updateOne({ _id: robot._id }, { statusUse: 'Mantenimiento' });
        }
    });

    try {
        await Promise.allSettled(robotPromises);
    } catch (error) {
        console.error('Error during robot initialization:', error.message);
        // Handle the case where no robots are available
        if (availableRobots.length === 0) {
            throw new Error('Could not communicate with any of the robots.');
        }
    }

    console.log('Robots disponibles:', availableRobots);

    return availableRobots;
}


// Detener experimento
exports.stopExperiment = async (req, res) => {
    try {
        const { id } = req.params;

        const experiment = await Experiment.findById(id).populate('robots');
        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }

        if (!experiment.isActive) {
            return res.status(400).json({ message: 'Experiment is not active' });
        }

        // Limpiar el timer si existe
        if (timers[id]) {
            clearTimeout(timers[id]);
            delete timers[id];
        }

        const privateKeyPath = path.join(process.env.HOME, '.ssh', 'id_rsa');

        const stopCommands = [
            'kill -9 $(cat ~/heartbeat.pid)',
            'kill -9 $(cat ~/diagnostics.pid)',
            'kill -9 $(cat ~/rosbridge.pid)',
            'kill -9 $(cat ~/diffbot.pid)',
            'kill -9 $(cat ~/rosbridge_children.pids)',
        ];

        const stopPromises = experiment.robots.map(robot => {
            return Promise.all(stopCommands.map(cmd => 
                execSshRosCommand(robot.ip, 'robot',  privateKeyPath, cmd,  'robot_ws')
                .then(() => console.log(`Stopped process on ${robot.model} (${robot.ip})`))
                .catch(err => console.error(`Error stopping process on ${robot.model} (${robot.ip}):`, err))
            ));
        });

        // Stop camera stream
        const cameraStopCommand = 'pkill -f stream_camera.py &';
        await execSshCommand('rpicamera1', 'robotgym', privateKeyPath, cameraStopCommand);
        console.log("Camera stream stopped");

        await Promise.all(stopPromises);

        await robotController.releaseRobots(experiment._id);

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

exports.getExperimentRobots = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid experiment ID' });
        }

        const experiment = await Experiment.findById(id).populate('robots');

        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }

        res.status(200).json(experiment.robots);
    } catch (error) {
        console.error('Error retrieving robots:', error);
        res.status(500).json({ message: 'Error retrieving robots', error: error.message });
    }
};
