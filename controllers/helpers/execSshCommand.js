const { exec } = require('child_process');

const execSshRosCommand = (host, username, privateKeyPath, command) => {
    return new Promise((resolve) => {
        const sshCommand = `ssh -i ${privateKeyPath} ${username}@${host} "${command}"`;
        exec(sshCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing SSH command: ${sshCommand}`);
                console.error(`Error details: ${stderr.trim() || error.message}`);
                // Resolve with a message or empty string instead of rejecting
                return resolve(`SSH command failed: ${stderr.trim() || 'Unknown error'}`);
            }
            resolve(stdout.trim());
        });
    });
};

module.exports = execSshRosCommand;
