const { Client } = require('node-scp');
const fs = require('fs');
const path = require('path');
const execSshCommand = require('./execSshCommand');

async function transferFilesToRobot(ip, packageName, files, localPackageDir) {
    try {
        // 1. Crear el paquete en la RPI del robot si no existe
        console.log(`Creating package on ${ip}: ${packageName}`);
        await execSshCommand(ip, 'robot', path.join(process.env.HOME, '.ssh', 'id_rsa'), `cd /home/robot/robot_ws/src && ros2 pkg create --build-type ament_cmake ${packageName}`);

        // 2. Transferir los archivos al paquete en la RPI del robot
        console.log(`Transferring files to ${ip}`);
        const client = await Client({
            host: ip,
            username: 'robot',
            privateKey: fs.readFileSync(path.join(process.env.HOME, '.ssh', 'id_rsa')),
        });

        for (const file of files) {
            const fileType = path.extname(file.fileName);
            const remotePath = `/home/robot/robot_ws/src/${packageName}/`;

            if (fileType === '.py') {
                await client.uploadFile(path.join(localPackageDir, file.fileName), `${remotePath}scripts/${file.fileName}`);
                console.log(`Python node transferred: ${file.fileName}`);
            } else if (fileType === '.cpp') {
                await client.uploadFile(path.join(localPackageDir, file.fileName), `${remotePath}src/${file.fileName}`);
                console.log(`C++ node transferred: ${file.fileName}`);
            }
        }

        // 3. Modificar el CMakeLists.txt en la RPI del robot
        const cmakeContent = `
cmake_minimum_required(VERSION 3.5)
project(${packageName})
# Default to C++14
if(NOT CMAKE_CXX_STANDARD)
  set(CMAKE_CXX_STANDARD 14)
endif()
if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()
# Find dependencies
find_package(ament_cmake REQUIRED)
find_package(ament_cmake_python REQUIRED)
find_package(rclcpp REQUIRED)
find_package(rclpy REQUIRED)
# Include Cpp "include" directory
include_directories(include)
# Create Cpp executables
${files.filter(file => path.extname(file.fileName) === '.cpp').map(file => `
add_executable(${path.basename(file.fileName, '.cpp')} src/${file.fileName})
ament_target_dependencies(${path.basename(file.fileName, '.cpp')} rclcpp)
`).join('')}
# Install Cpp executables
install(TARGETS
  ${files.filter(file => path.extname(file.fileName) === '.cpp').map(file => path.basename(file.fileName, '.cpp')).join(' ')}
  DESTINATION lib/${packageName}
)
# Install Python modules
ament_python_install_package(${packageName})
# Install Python executables
install(PROGRAMS
  ${files.filter(file => path.extname(file.fileName) === '.py').map(file => `scripts/${file.fileName}`).join(' ')}
  DESTINATION lib/${packageName}
)
ament_package()
`;

        // Escribir el archivo CMakeLists.txt modificado en el robot
        const remoteCMakeListsPath = `/home/robot/robot_ws/src/${packageName}/CMakeLists.txt`;
        await client.uploadFile(Buffer.from(cmakeContent), remoteCMakeListsPath);
        console.log(`CMakeLists.txt transferred to ${ip}`);

        // Cerrar la conexión SCP
        client.close();

    } catch (error) {
        console.error(`Error transferring files to ${ip}:`, error);
        throw error;
    }
}

module.exports = transferFilesToRobot;
