// controllers/secureRouteController.js
exports.protected = (req, res) => {
    res.json({ message: 'Access to protected route!', user: req.user });
};
