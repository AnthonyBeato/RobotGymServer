const Session = require('../models/Sesion');
const Port = require('../models/Ports');
const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const path = require('path');
const fs = require('fs');

// Función para conectar y ejecutar un comando en EC2
async function runCommandOnEC2(command) {
    const privateKeyPath = path.join(process.cwd(), 'key/robotgym.pem');
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

    await ssh.connect({
        host: 'ec2-54-198-167-134.compute-1.amazonaws.com',
        username: 'ubuntu',
        privateKey: privateKey
    });

    console.log("Connected, executing command:", command);
    const response = await ssh.execCommand(command);
    console.log("Command executed, response:", response);
    ssh.dispose(); // Cierra la conexión después de ejecutar el comando
    return response; // Retorna la respuesta del comando
}

// Función para encontrar puertos disponibles
async function findAvailablePort(type) {
    const basePort = type === 'VNC' ? 5900 : 6900;
    const limitPort = type === 'VNC' ? 6000 : 7100;

    for (let port = basePort; port < limitPort; port++) {
        const portRecord = await Port.findOne({ portNumber: port, type: type });
        if (!portRecord || !portRecord.inUse) {
            return port; // Retorna el primer puerto disponible
        }
    }
    throw new Error(`No available ${type} ports`);
}

exports.createSession = async (req, res) => {
    const { username } = req.body;
    try {
        let session = await Session.findOne({ username });

        if (session && session.isActive) {
            return res.status(400).send({ message: 'A session for this user is already active.' });
        }

        const vncPort = await findAvailablePort('VNC');
        const wsPort = await findAvailablePort('WebSocket');

        if (!session) {
            session = new Session({ username, vncPort, wsPort, isActive: true });
        } else {
            session.vncPort = vncPort;
            session.wsPort = wsPort;
            session.isActive = true;
        }
        await session.save();

        // Marcar los puertos como usados o crear nuevos registros de puerto
        await Port.updateOne({ portNumber: vncPort, type: 'VNC' }, { inUse: true, session: session._id }, { upsert: true });
        await Port.updateOne({ portNumber: wsPort, type: 'WebSocket' }, { inUse: true, session: session._id }, { upsert: true });

        // Configura y ejecuta la sesión VNC
        let command = `/usr/bin/vncserver :${vncPort - 5900} -geometry 1280x800 -depth 24`;
        await runCommandOnEC2(command);

        // Configura y ejecuta Websockify
        command = `/home/ubuntu/.nvm/versions/node/v20.12.2/bin/pm2 start /usr/bin/websockify --interpreter "python3" --name ${username}_ws -- --web /usr/share/novnc/ ${wsPort} localhost:${vncPort}`;
        await runCommandOnEC2(command);

        res.send({ message: 'VNC session and Websockify started with pm2', vncPort, wsPort });
    } catch (error) {
        console.error('Error starting VNC session or Websockify:', error);
        res.status(500).send({ message: 'Error starting VNC session or Websockify', error: error.toString() });
    }
};


exports.closeSession = async (req, res) => {
    const { sessionId } = req.body;
    const session = await Session.findById(sessionId);

    if (session) {
        await Port.updateMany({ session: sessionId }, { inUse: false });
        session.isActive = false;
        await session.save();
        res.send({ message: 'Session closed and ports released' });
    } else {
        res.status(404).send({ message: 'Session not found' });
    }
};


