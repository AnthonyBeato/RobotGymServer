const jwt = require('jsonwebtoken');
const { generateAccessToken } = require('../services/tokenService');
const RefreshToken = require('../models/RefreshToken');
const User = require('../models/user');


exports.refreshAccessToken = async (req, res) => {
    const { token: refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const storedToken = await RefreshToken.findOne({ token: refreshToken });

        if (!storedToken) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Invalid refresh token' });

            try {
                const user = await User.findById(decoded.userId);
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }

                const newAccessToken = generateAccessToken(user);
                res.status(200).json({ accessToken: newAccessToken });
            } catch (err) {
                console.error('Error fetching user: ', err);
                res.status(500).json({ message: 'Internal server error' });
            }
        });
    } catch (err) {
        console.error('Error refreshing access token: ', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
