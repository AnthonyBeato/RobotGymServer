const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Experiment = require('./Experiment');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['Administrador', 'Profesor', 'Estudiante'],
        default: 'Estudiante'
    },
    aprobationStatus: {
        type: String,
        enum: ['Aceptado', 'Pendiente', 'Rechazado'],
        default: 'Pendiente'
    },
    experiments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experiment'
    }],
});

userSchema.pre('remove', async function (next) {
    try {
        await Experiment.deleteMany({ _id: { $in: this.experiments } });
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.pre('save', async function (next) {
    if (this.isModified('password') || this.isNew) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
