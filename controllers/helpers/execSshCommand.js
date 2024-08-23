const { exec } = require('child_process');

const execSshCommand = (host, username, privateKeyPath, command, rosWorkspaceName) => {
    return new Promise((resolve, reject) => {
        const sshCommand = `ssh -i ${privateKeyPath} ${username}@${host} "source /opt/ros/humble/setup.bash && source /home/${username}/${rosWorkspaceName}/install/setup.bash && ${command}"`;
        exec(sshCommand, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });
    });
};
module.exports = execSshCommand;
