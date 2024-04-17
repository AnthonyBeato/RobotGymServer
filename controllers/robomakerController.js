const AWS = require('aws-sdk');

// Función para iniciar una simulación usando AWS RoboMaker
exports.startSimulation = async (req, res) => {
    const robomaker = new AWS.RoboMaker();

    const params = {
        // Configura tus parámetros específicos aquí
        maxJobDurationInSeconds: 3600, // Ejemplo de duración máxima
        iamRole: process.env.AWS_ROBOMAKER_ROLE,
        simulationApplications: [{ /* Define tu aplicación de simulación */ }],
        // Otros parámetros necesarios
    };

    try {
        const data = await robomaker.createSimulationJob(params).promise();
        res.status(200).json({ message: 'Simulation started successfully', data: data });
    } catch (error) {
        res.status(500).json({ message: 'Failed to start simulation', error: error.message });
    }
};

// Función para detener una simulación de AWS RoboMaker
exports.stopSimulation = async (req, res) => {
    const robomaker = new AWS.RoboMaker();
    const simulationJobId = req.params.id; // Asumiendo que el ID viene como parámetro

    try {
        const data = await robomaker.cancelSimulationJob({ job: simulationJobId }).promise();
        res.status(200).json({ message: 'Simulation stopped successfully', data: data });
    } catch (error) {
        res.status(500).json({ message: 'Failed to stop simulation', error: error.message });
    }
};

// Función para iniciar un nuevo trabajo de simulación
function createSimulationJob(params) {
    return new Promise((resolve, reject) => {
        roboMaker.createSimulationJob(params, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

// Ejemplo de cómo llamar a la función createSimulationJob con los parámetros necesarios
const simulationParams = {
    // ... define tus parámetros aquí, como la aplicación de simulación, fuentes, etc.
};

createSimulationJob(simulationParams)
    .then(data => console.log(data))
    .catch(err => console.error(err));


    // Ejemplo de función para cancelar un trabajo de simulación
function cancelSimulationJob(jobId) {
    const params = {
        job: jobId
    };

    roboMaker.cancelSimulationJob(params, function(err, data) {
        if (err) console.error(err);
        else console.log(data);
    });
}

// Ejemplo de función para describir un trabajo de simulación
function describeSimulationJob(jobId) {
    const params = {
        job: jobId
    };

    roboMaker.describeSimulationJob(params, function(err, data) {
        if (err) console.error(err);
        else console.log(data);
    });
}
