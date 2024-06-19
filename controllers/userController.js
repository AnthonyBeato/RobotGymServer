const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


exports.registerUser = async (req, res) => {
    try {
        const { name, email, username, password } = req.body;
        if (!email || !name || !username || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const user = new User({ name, username, email, password });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
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

        // Usuario autenticado, crear token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
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

exports.logoutUser = (req, res) => {
    // TODO: Lógica para cerrar sesión
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find;
        res.status(200).json(users);
    } catch (error) {
        console.error('Failed to retrieve users:', error);
        res.status(500).send({ message: 'Failed to retrieve users', error: error.toString() });
    }
};