const User = require('../models/user')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Experiment = require('../models/Experiment');

exports.createUser = async (req, res) => {
    try {
        const { name, email, username, password, role, aprobationStatus } = req.body;
        if (!email || !name || !username || !password || !role || !aprobationStatus) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const user = new User({ name, username, email, password, role, experiments: [] , aprobationStatus });
        await user.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error created user', error: error.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role, aprobationStatus: user.aprobationStatus },
            process.env.JWT_SECRET,
            { expiresIn: '6h' }
        );

        res.status(200).json({
            message: 'Authentication successful',
            token: token,
            userId: user._id
        });
    } catch (error) {
        res.status(500).json({ message: 'Error in login', error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().populate('experiments');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve users', error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('experiments');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve user', error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, username, role, experiments, aprobationStatus } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.username = username || user.username;
        user.role = role || user.role;
        user.experiments = experiments || user.experiments;
        user.aprobationStatus = aprobationStatus || user.aprobationStatus;

        await user.save();

        res.status(200).json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Eliminar todos los experimentos asociados
        await Experiment.deleteMany({ _id: { $in: user.experiments } });

        // Luego eliminar el usuario
        await User.deleteOne({ _id: id });

        res.status(200).json({ message: 'User and associated experiments deleted successfully' });
    } catch (error) {
        console.error('Error during user deletion:', error); // Añadir logs detallados
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};