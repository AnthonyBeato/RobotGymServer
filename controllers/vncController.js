const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const path = require('path');
const fs = require('fs');


// Función para conectar y ejecutar un comando en EC2
async function runCommandOnEC2(command) {
    try {
        const privateKeyPath = path.resolve('C:/Users/anton/Development/robot_gym_server/key/robotgym.pem');
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        await ssh.connect({
            host: 'ec2-3-88-103-142.compute-1.amazonaws.com',
            username: 'ubuntu',
            privateKey: privateKey
        });

        const response = await ssh.execCommand(command);
        ssh.dispose(); // Cierra la conexión después de ejecutar el comando
        return response; // Retorna la respuesta del comando
    } catch (error) {
        console.error('Error al conectar o ejecutar el comando en EC2:', error);
        throw error; // Lanza el error para manejo superior
    }
}

exports.createSession = async (req, res) => {
    const { username, simulationScript } = req.body;
    try {
        // Verifica o crea el usuario
        let command = `id ${username} || sudo adduser --disabled-password --gecos "" ${username}`;
        await runCommandOnEC2(command);

        // Inicia la sesión VNC y el script de simulación
        // command = `su - ${username} -c "tightvncserver :1 -geometry 1280x800 -depth 24 && roslaunch ${simulationScript}"`;
        command = `su - ${username} -c "tightvncserver :1 -geometry 1280x800 -depth 24"`;
        await runCommandOnEC2(command);

        // Inicia Websockify
        const vncPort = 5900 + parseInt(username.slice(-1)); // Puerto VNC
        const wsPort = 6900 + parseInt(username.slice(-1)); // Puerto WebSocket
        command = `websockify ${wsPort} localhost:${vncPort}`;
        await runCommandOnEC2(command);

        res.send({ message: 'VNC session and Websockify started' });
    } catch (error) {
        res.status(500).send({ message: 'Error starting VNC session or Websockify', error: error.toString() });
    }
};

exports.closeSession = async (req, res) => {
    const { username } = req.body;
    try {
        // Comando para cerrar la sesión VNC del usuario
        const command = `sudo -u ${username} tightvncserver -kill :1`;
        await runCommandOnEC2(command);
        res.send({ message: 'VNC session closed' });
    } catch (error) {
        console.error(`Error closing VNC session: ${error}`);
        res.status(500).send({ message: 'Error closing VNC session', error: error.toString() });
    }
};
