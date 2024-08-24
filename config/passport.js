const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/user');

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET;
opts.ignoreExpiration = false; // Añadido para asegurarse de que los tokens expirados sean rechazados

module.exports = passport => {
    passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
        try {
            const user = await User.findById(jwt_payload.userId);
            if (user) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'User not found' });
            }
        } catch (err) {
            console.error('Error fetching user: ', err);
            return done(err, false);
        }
    }));
};