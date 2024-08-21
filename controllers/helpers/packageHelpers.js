const { Client } = require('node-scp');
const fs = require('fs');
const path = require('path');

async function createPythonPackageFiles(username, packageName, nodeName) {
    const client = await Client({
        host: 'rpiorquestadora.local',
        username: 'orquestadora',
        privateKey: fs.readFileSync(path.join(process.env.HOME, '.ssh', 'id_rsa')),
    });

    const packageXmlContent = `<?xml version="1.0"?>
<package format="3">
  <name>${packageName}</name>
  <version>0.0.0</version>
  <description>Paquete para crear y ejecutar rutinas en el robot usando Python</description>
  <maintainer email="anthonybeato@example.com">anthonybeato</maintainer>
  <license>TODO: License declaration</license>
  <test_depend>ament_copyright</test_depend>
  <test_depend>ament_flake8</test_depend>
  <test_depend>ament_pep257</test_depend>
  <test_depend>python3-pytest</test_depend>
  <build_depend>rclpy</build_depend>
  <build_depend>geometry_msgs</build_depend>
  <exec_depend>rclpy</exec_depend>
  <exec_depend>geometry_msgs</exec_depend>
  <export>
    <build_type>ament_python</build_type>
  </export>
</package>`;

    const setupPyContent = `from setuptools import find_packages, setup

setup(
    name='${packageName}',
    version='0.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages', ['resource/' + '${packageName}']),
        ('share/${packageName}', ['package.xml']),
        ('share/${packageName}/launch', ['launch/routine_node_launch.py']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='${username}',
    maintainer_email='${username}@example.com',
    description='Paquete para crear y ejecutar rutinas en el robot',
    license='TODO: License declaration',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            '${nodeName.replace('.py', '')} = ${packageName}.${nodeName.replace('.py', '')}:main',
        ],
    },
)`;

    await client.uploadFile(Buffer.from(packageXmlContent), `/home/orquestadora/ros2_ws/src/${packageName}/package.xml`);
    await client.uploadFile(Buffer.from(setupPyContent), `/home/orquestadora/ros2_ws/src/${packageName}/setup.py`);

    client.close();
}

async function createCppPackageFiles(username, packageName, nodeName) {
    const client = await Client({
        host: 'rpiorquestadora.local',
        username: 'orquestadora',
        privateKey: fs.readFileSync(path.join(process.env.HOME, '.ssh', 'id_rsa')),
    });

    const packageXmlContent = `<?xml version="1.0"?>
<package format="3">
  <name>${packageName}</name>
  <version>0.0.0</version>
  <description>Paquete para crear y ejecutar rutinas en el robot usando C++</description>
  <maintainer email="${username}@example.com">${username}</maintainer>
  <license>TODO: License declaration</license>
  <buildtool_depend>ament_cmake</buildtool_depend>
  <depend>rclcpp</depend>
  <depend>geometry_msgs</depend>
  <depend>std_msgs</depend>
  <test_depend>ament_lint_auto</test_depend>
  <test_depend>ament_lint_common</test_depend>
  <export>
    <build_type>ament_cmake</build_type>
  </export>
</package>`;

    const cmakeListsContent = `cmake_minimum_required(VERSION 3.8)
project(${packageName})

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(std_msgs REQUIRED)

include_directories(include)

add_executable(${nodeName.replace('.cpp', '')} src/${nodeName})

ament_target_dependencies(${nodeName.replace('.cpp', '')} rclcpp geometry_msgs std_msgs)

install(TARGETS
  ${nodeName.replace('.cpp', '')}
  DESTINATION lib/${packageName})

install(DIRECTORY launch
  DESTINATION share/${packageName}/)

ament_package()`;

    await client.uploadFile(Buffer.from(packageXmlContent), `/home/orquestadora/ros2_ws/src/${packageName}/package.xml`);
    await client.uploadFile(Buffer.from(cmakeListsContent), `/home/orquestadora/ros2_ws/src/${packageName}/CMakeLists.txt`);

    client.close();
}

module.exports = { createPythonPackageFiles, createCppPackageFiles };
