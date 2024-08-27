// controllers/routineController.js
const mongoose = require('mongoose');
const Routine = require('../models/Routine')
const path = require('path');
// const { Client } = require('node-scp');
// const { createPythonPackageFiles, createCppPackageFiles } = require('./helpers/packageHelpers');
const execSshRosCommand = require('./helpers/execSshRosCommand');
const transferRoutineFilesToOrchestrator = require('./helpers/transferRoutineFilesToOrchestrator');
const Robot = require('../models/robot');
const robotController = require('../controllers/robotController');

// Leer rutinas
exports.getRoutines = async (req, res) => {
    try {
        const routines = await Routine.find();
        res.status(200).json(routines);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving routines', error: error.message });
    }
};

// Leer una rutina
exports.getRoutine = async (req, res) => {
    try {
        const { id } = req.params;

        const routine = await Routine.findById(id);
        res.status(200).json(routine);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving routine', error: error.message });
    }
};

// Subir una o más rutinas y transferir a RPI4 orquestadora
exports.uploadRoutineFiles = async (req, res) => {
    try {
        const { experimentId } = req.body;
        // const user = req.user;
        const file = req.file;
        
        // Verificar que experimentId es un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(experimentId)) {
            return res.status(400).json({ message: 'Invalid experiment ID' });
        }

        if (!file) {
            return res.status(400).json({ message: 'No files uploaded' });
        }
        
        console.log('Experiment ID:', experimentId);
        console.log('File received:', file);


        console.log('Experiment ID:', experimentId);
        console.log('File received:', file);

        const routine = new Routine({
            name: file.originalname,
            file: {
                data: file.buffer, 
                fileName: file.originalname,
                fileType: file.mimetype,
            },
            experiment: experimentId,
            status: 'Borrador',
        });

        await routine.save();
        console.log('Routine saved:', routine);

        res.status(201).json({ message: 'Routine uploaded and transferred successfully', routine });

    } catch (error) {
        console.error('Error in uploadRoutineFiles:', error);
        res.status(500).json({ message: 'Error uploading routines', error: error.message });
    }
};


// Distribuir los archivos a las RPI4 de los robots y ejecutar la rutina
exports.runRoutine = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`Fetching routine with ID: ${id}`);
        const routine = await Routine.findById(id).populate('experiment');
        if (!routine) {
            console.log('Routine not found');
            return res.status(404).json({ message: 'Routine not found' });
        }
        const privateKeyPath = path.join(process.env.HOME, '.ssh', 'id_rsa');
        const packageName = `${req.user.username}_pkg`;

        await transferRoutineFilesToOrchestrator(packageName, routine.file);

        await routine.updateOne({status: 'Ejecutandose'});

        // Ejecutar rutina en la orquestadora
        const orchestratorIP = 'rpiorquestadora'; 
        await execSshRosCommand(orchestratorIP, 'orquestadora', privateKeyPath, `cd ros2_ws && nohup ros2 run ${packageName} ${routine.file.fileName} > ~/routine.log 2>&1 & echo $! > ~/routine.pid`, 'ros2_ws');
        console.log('se completó la ejecución de la rutina');


        res.status(200).json({ message: 'Routine executed successfully on all robots' });

    } catch (error) {
        console.error('Error in runRoutine:', error);
        res.status(500).json({ message: 'Error executing routine', error: error.message });
    }
};

exports.stopRoutine = async (req, res) => {
    try {
        const { experimentId } = req.body;

        const routine = await Routine.findOne({ experiment: experimentId, status: 'Ejecutandose' });
        if (!routine) {
            return res.status(404).json({ message: 'No active routine found for this experiment' });
        }

        const privateKeyPath = path.join(process.env.HOME, '.ssh', 'id_rsa');
        const orchestratorIP = 'rpiorquestadora';
        
        // Detener la rutina en la orquestadora usando el PID
        console.log(`Stopping routine on orchestrator for experiment ${experimentId}`);
        await execSshRosCommand(orchestratorIP, 'orquestadora', privateKeyPath, `(kill -9 $(cat ~/routine.pid) && rm ~/routine.pid) &`, 'ros2_ws');

        // Asegurar que todos los robots estén detenidos
        const robots = await Robot.find({ statusUse: 'Disponible' });

        const stopPromises = robots.map(async (robot) => {
            const robotNumber = robotController.getRobotNumber(robot.hostname);
            if (!robotNumber) {
                throw new Error(`Could not extract robot number from hostname: ${robot.hostname}`);
            }

            const stopCommand = `cd ros2_ws && nohup ros2 run robot_routine_management_pkg > ~/stop.log 2>&1 & echo $! > ~/stop.pid`;
            await execSshRosCommand(robot.ip, 'robot', privateKeyPath, stopCommand, 'robot_ws');
            console.log(`Stop command sent to robot_${robotNumber} at ${robot.ip}`);
        });

        await Promise.all(stopPromises);

        console.log('All robots have been stopped.');
        res.status(200).json({ message: 'Routine stopped successfully, all robots are now stationary' });

    } catch (error) {
        console.error('Error stopping routine:', error);
        res.status(500).json({ message: 'Error stopping routine', error: error.message });
    }
};
