// controllers/routineController.js
const mongoose = require('mongoose');
const Routine = require('../models/Routine')
const path = require('path');
const fs = require('fs');
// const { Client } = require('node-scp');
// const { createPythonPackageFiles, createCppPackageFiles } = require('./helpers/packageHelpers');
const execSshCommand = require('./helpers/execSshCommand');
const transferFilesToRobot = require('./helpers/transferFilesToRobot');

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
        const files = req.files; // Array of uploaded files
        
        // Verificar que experimentId es un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(experimentId)) {
            return res.status(400).json({ message: 'Invalid experiment ID' });
        }

        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }
        
        console.log('Experiment ID:', experimentId);
        console.log('Files received:', files);

        const uploadedFiles = [];
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'routineFiles'
        });

        // Procesar cada archivo subido
        for (const file of files) {
            try {
                console.log('Processing file:', file.originalname);
                
                const fileType = path.extname(file.originalname);

                // Guardar archivo en GridFS
                console.log('Saving file to GridFS:', file.originalname);
                const uploadStream = bucket.openUploadStream(file.originalname);
                fs.createReadStream(file.path).pipe(uploadStream);

                await new Promise((resolve, reject) => {
                    uploadStream.on('finish', () => {
                        console.log('File saved to GridFS:', file.originalname);
                        uploadedFiles.push({
                            fileId: uploadStream.id,
                            fileName: file.originalname,
                            fileType: fileType,
                        });
                        resolve();
                    });
                    uploadStream.on('error', (error) => {
                        console.error('Error saving file to GridFS:', error);
                        reject(error);
                    });
                });

            } catch (fileError) {
                console.error('Error processing file:', file.originalname, fileError);
                return res.status(500).json({ message: `Error processing file ${file.originalname}`, error: fileError.message });
            }
        }

        // Crear la rutina en la base de datos
        const routine = new Routine({
            name: files[0].originalname,
            files: uploadedFiles,
            experiment: experimentId,
            status: 'Borrador'
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

        const robotIps = ['192.168.1.114', 'rpirobot2']; // IPs de las RPI4 de los robots
        // const packageName = routine.files[0].fileType === '.py' ? `${req.user.username}_py` : `${req.user.username}_cpp`;
        // cosnt
        const packageName = `${req.user.username}_pkg`;
        
        // Transferir los archivos a todos los robots
        await Promise.all(robotIps.map(async (ip) => {
            await transferFilesToRobot(ip, packageName, routine.files);
        }));

        // Ejecutar las rutinas en paralelo
        const executionPromises = robotIps.map(async (ip) => {
            return execSshCommand(ip, 'robot', path.join(process.env.HOME, '.ssh', 'id_rsa'), `ros2 run ${packageName} ${routine.files[0].fileName}`);
        });

        // Esperar a que todos los robots terminen de ejecutar la rutina
        await Promise.all(executionPromises);

        res.status(200).json({ message: 'Routine executed successfully on all robots' });

    } catch (error) {
        console.error('Error in runRoutine:', error);
        res.status(500).json({ message: 'Error executing routine', error: error.message });
    }
};