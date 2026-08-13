const db = require('../config/db');

module.exports = async (req, res, next) => {
    try {
        // Skip maintenance mode for admin dashboard, settings, auth APIs and swagger
        const path = req.originalUrl;
        if (
            path.startsWith('/admin') ||
            path.startsWith('/api/auth') ||
            path.startsWith('/api/dashboard') ||
            path.startsWith('/api-docs')
        ) {
            return next();
        }

        const setting = await db.globalSetting.findUnique({ where: { key: 'maintenanceMode' } });
        if (setting && setting.value === 'true') {
            if (req.xhr || path.startsWith('/api/')) {
                return res.status(503).json({ success: false, message: 'Service is temporarily unavailable due to maintenance.' });
            }
            return res.status(503).send('<h1>Site Under Maintenance</h1><p>We will be back shortly.</p>');
        }
        next();
    } catch (err) {
        next(err);
    }
};
