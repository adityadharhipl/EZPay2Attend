const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/db');

exports.authenticate = async (req, res, next) => {
    let token;

    // 1. Check Authorization header first (useful for Swagger/Postman testing)
    if (req.headers.authorization) {
        if (req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else {
            token = req.headers.authorization;
        }
    }

    // 2. Fallback to cookies (for browser sessions)
    // Ignore cookies if the request is from Swagger UI so we can test 401s properly
    const isSwagger = req.headers.referer && req.headers.referer.includes('/api-docs');
    if (!token && req.cookies && req.cookies.token && !isSwagger) {
        token = req.cookies.token;
    }

    // Function to handle unauthorized based on request type
    const handleUnauthorized = (msg = 'Unauthorized') => {
        // If the route is an API route (not the login page itself), always return JSON 401
        if (req.originalUrl.startsWith('/api/') && !req.originalUrl.startsWith('/api/auth/login')) {
            return res.status(401).json({ success: false, message: msg });
        }

        // For frontend dashboard/admin routes, redirect to login page only if it's a browser requesting HTML
        if (req.headers.accept && req.headers.accept.includes('text/html') && !req.xhr) {
            res.clearCookie('token');
            return res.redirect('/api/auth/login');
        }

        // Otherwise (like Swagger sending */*), return 401 JSON
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
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '-1');

        next();
    } catch (err) {
        const exactJwtErrors = [
            'jwt expired',
            'invalid signature',
            'jwt malformed',
            'secret or public key must be provided'
        ];

        if (exactJwtErrors.includes(err.message)) {
            return handleUnauthorized(err.message);
        }

        return handleUnauthorized('Invalid token signature');
    }
};
