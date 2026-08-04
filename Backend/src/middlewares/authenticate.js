const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/db');

exports.authenticate = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    // Function to handle unauthorized based on request type
    const handleUnauthorized = (msg = 'Unauthorized') => {
        // If the route is an API route (not the login page itself), always return JSON 401
        if (req.originalUrl.startsWith('/api/') && !req.originalUrl.startsWith('/api/auth/login')) {
            return res.status(401).json({ success: false, message: msg });
        }
        
        // For frontend dashboard/admin routes, redirect to login page
        if (req.accepts('html') && !req.xhr) {
            res.clearCookie('token');
            return res.redirect('/api/auth/login');
        }
        
        return res.status(401).json({ success: false, message: msg });
    };

    if (!token) return handleUnauthorized('No token provided, authorization denied');

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        const user = await db.user.findUnique({ where: { id: decoded.id } });
        if (!user) return handleUnauthorized('Invalid or expired token');
        
        req.user = user;
        res.locals.user = user; // for EJS
        
        // Prevent browser caching for protected routes (disables back button after logout)
        res.setHeader('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        
        next();
    } catch (err) {
        return handleUnauthorized('Invalid token signature');
    }
};
