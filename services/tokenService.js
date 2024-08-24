const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

function generateAccessToken(user) {
    return jwt.sign({ userId: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function generateRefreshToken(user) {
    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
    const refreshToken = new RefreshToken({
        token,
        user: user._id,
        expiresAt: new Date(Date.now() + 30*24*60*60*1000) // 30 días desde ahora
    });
    return refreshToken.save();
}

async function removeRefreshToken(token) {
    await RefreshToken.deleteOne({ token });
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    removeRefreshToken,
};
