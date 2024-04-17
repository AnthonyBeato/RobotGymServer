const AWS = require('aws-sdk');

// Configurar credenciales y región
AWS.config.update({
    region: process.env.AWS_REGION
});

// Creamos un objeto RoboMaker configurado para la región deseada
const roboMaker = new AWS.RoboMaker({apiVersion: '2018-06-29'});