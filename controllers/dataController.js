// Importar modelos según sea necesario
const Simulation = require('../models/simulation');

exports.getProtectedData = async (req, res) => {
    try {
        // Simular la recuperación de datos que requieren autenticación
        // Por ejemplo, obtener datos de simulaciones relacionadas con el usuario autenticado
        const simulations = await Simulation.find({ userId: req.user.userId });

        res.json({
            message: 'Datos protegidos obtenidos con éxito',
            data: simulations
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener datos protegidos',
            error: error.message
        });
    }
};

exports.updateSimulationData = async (req, res) => {
    try {
        // Actualizar una simulación específica, asegurando que pertenezca al usuario
        const simulation = await Simulation.findOneAndUpdate({
            _id: req.params.id,
            userId: req.user.userId
        }, req.body, { new: true });

        if (!simulation) {
            return res.status(404).json({ message: 'Simulación no encontrada o acceso denegado' });
        }

        res.json({
            message: 'Simulación actualizada con éxito',
            data: simulation
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al actualizar la simulación',
            error: error.message
        });
    }
};
