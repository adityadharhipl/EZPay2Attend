const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/db');

exports.authenticate = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    // Function to handle unauthorized based on request type
    const handleUnauthorized = () => {
        if (req.accepts('html') && !req.xhr) {
            return res.redirect('/api/auth/login');
        }
        return res.status(401).json({ message: 'Unauthorized' });
    };

    if (!token) return handleUnauthorized();

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        const user = await db.user.findUnique({ where: { id: decoded.id } });
        if (!user) return handleUnauthorized();
        
        req.user = user;
        res.locals.user = user; // for EJS
        next();
    } catch (err) {
        if (req.accepts('html') && !req.xhr) {
            res.clearCookie('token');
            return res.redirect('/api/auth/login');
        }
        return res.status(401).json({ message: 'Invalid token' });
    }
};
