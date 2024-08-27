const { Client } = require('node-scp');
const fs = require('fs');
const path = require('path');
const execSshCommand = require('./execSshRosCommand');
const os = require('os');

async function transferRoutineFilesToOrchestrator(packageName, routineFile) {
    const orchestratorIP = 'rpiorquestadora'; 
    const privateKeyPath = path.join(process.env.HOME, '.ssh', 'id_rsa');

    try {
        // 1. Crear el paquete en la orquestadora si no existe
        console.log(`Creating package on orchestrator: ${packageName}`);
        await execSshCommand(orchestratorIP, 'orquestadora', privateKeyPath, 
        `rm -rf /home/orquestadora/ros2_ws/src/${packageName} && cd /home/orquestadora/ros2_ws/src && ros2 pkg create --build-type ament_cmake ${packageName} && mkdir -p ${packageName}/scripts && mkdir -p ${packageName}/${packageName}`, 'ros2_ws');

        // 2. Transferir el archivo de la rutina al paquete en la orquestadora
        console.log(`Transferring files to orchestrator`);
        const client = await Client({
            host: orchestratorIP,
            username: 'orquestadora',
            privateKey: fs.readFileSync(privateKeyPath),
        });

        const fileType = path.extname(routineFile.fileName);
        console.log('File type', fileType);
        const remotePath = `/home/orquestadora/ros2_ws/src/${packageName}/`;
        
        const tempDir = os.tmpdir();  
        const tempFilePath = path.join(tempDir, routineFile.fileName);
        console.log('temp file path: ', tempFilePath)

        // Asegurarse de que el archivo Python tenga el shebang correcto
        let fileData = routineFile.data;
        if (fileType === '.py') {
            const shebang = '#!/usr/bin/env python3\n';
            if (!fileData.includes(shebang)) {
                fileData = Buffer.concat([Buffer.from(shebang), fileData]);
            }
        }

        // Escribiendo el archivo de la rutina temporalmente en la orquestadora
        fs.writeFileSync(tempFilePath, fileData);

        // Verificar que el archivo se haya escrito correctamente
        if (!fs.existsSync(tempFilePath)) {
            throw new Error(`Temporary file was not created at ${tempFilePath}`);
        }

        if (fileType === '.py') {
            await client.uploadFile(tempFilePath, `${remotePath}scripts/${routineFile.fileName}`);
            console.log(`Python node transferred: ${routineFile.fileName}`);
        } else if (fileType === '.cpp') {
            await client.uploadFile(tempFilePath, `${remotePath}src/${routineFile.fileName}`);
            console.log(`C++ node transferred: ${routineFile.fileName}`);
        }

        // Eliminar el archivo temporal después de la transferencia
        fs.unlinkSync(tempFilePath);

        // 3. Crear el archivo __init__.py en la orquestadora
        const initFilePath = path.join(tempDir, '__init__.py');
        fs.writeFileSync(initFilePath, '');  // Crear un archivo __init__.py vacío
        await client.uploadFile(initFilePath, `${remotePath}${packageName}/__init__.py`);
        console.log(`__init__.py transferred to orchestrator`);

        // Eliminar el archivo __init__.py temporal después de la transferencia
        fs.unlinkSync(initFilePath);

        // 4. Modificar el CMakeLists.txt localmente
        const cmakeContent = `
cmake_minimum_required(VERSION 3.8)
project(${packageName})
if(NOT CMAKE_CXX_STANDARD)
set(CMAKE_CXX_STANDARD 14)
endif()
if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
add_compile_options(-Wall -Wextra -Wpedantic)
endif()
find_package(ament_cmake REQUIRED)
find_package(ament_cmake_python REQUIRED)
find_package(rclcpp REQUIRED)
find_package(rclpy REQUIRED)
include_directories(include)
${fileType === '.cpp' ? `
add_executable(${path.basename(routineFile.fileName, '.cpp')} src/${routineFile.fileName})
ament_target_dependencies(${path.basename(routineFile.fileName, '.cpp')} rclcpp)
` : ''}
${fileType === '.cpp' ? `
install(TARGETS
${path.basename(routineFile.fileName, '.cpp')}
DESTINATION lib/${packageName}
)` : ''}
ament_python_install_package(${packageName})
${fileType === '.py' ? `
install(PROGRAMS
scripts/${routineFile.fileName}
DESTINATION lib/${packageName}
)` : ''}
ament_package()
`;
        // Escribir el archivo CMakeLists.txt temporalmente
        const tempCMakeListsPath = path.join(tempDir, 'CMakeLists.txt');
        fs.writeFileSync(tempCMakeListsPath, cmakeContent);
        console.log(`CMakeLists.txt written locally at ${tempCMakeListsPath}`);

        // Transferir el archivo CMakeLists.txt a la orquestadora
        const remoteCMakeListsPath = `${remotePath}CMakeLists.txt`;
        await client.uploadFile(tempCMakeListsPath, remoteCMakeListsPath);
        console.log(`CMakeLists.txt transferred to orchestrator`);

        // Eliminar el archivo CMakeLists.txt temporal después de la transferencia
        fs.unlinkSync(tempCMakeListsPath);

        // 5. En caso de ser el archivo de python creado en windows, usar dos2unix para convertirlo a unix style line endings (LF)
        await execSshCommand(orchestratorIP, 'orquestadora', privateKeyPath, `cd /home/orquestadora/ros2_ws/src/${packageName}/scripts && dos2unix ${routineFile.fileName} && chmod +x ${routineFile.fileName}`, 'ros2_ws');

        // 6. Construir el paquete en la orquestadora
        await execSshCommand(orchestratorIP, 'orquestadora', privateKeyPath, `cd /home/orquestadora/ros2_ws && colcon build --packages-select ${packageName}`, 'ros2_ws');


        // Close the SCP connection
        client.close();

    } catch (error) {
        console.error(`Error transferring files to orchestrator:`, error);
        throw error;
    }
}


module.exports = transferRoutineFilesToOrchestrator;
