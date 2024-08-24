const { removeRefreshToken } = require('../services/tokenService');

exports.logout = async  (req, res) => {
    const { token } = req.body;
    await removeRefreshToken(token);
    res.sendStatus(204);
};