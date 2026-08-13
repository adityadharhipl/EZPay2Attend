const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

// Catch body-parser SyntaxErrors for invalid JSON (like empty body)
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ success: false, message: 'Invalid JSON payload received' });
    }
    next(err);
});

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// EJS View Engine Setup
// Adjust path since app.js is in src/
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));

// Basic route to check if server is running
app.get('/', (req, res) => {
    res.render('index', { title: 'EZPay2Attend' });
});

// Swagger Setup
const swaggerUi = require('swagger-ui-express');
const { specs, uiOptions } = require('./config/swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, uiOptions));

// Import Routes
app.use(require('./middlewares/maintenance'));
app.use('/', require('./modules/public/public.routes'));
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/admin/settings', require('./modules/settings/settings.routes'));
app.use('/admin', require('./modules/dashboard/dashboard.routes'));
app.use('/api/dashboard', require('./modules/dashboard/dashboard.routes'));
app.use('/api/schools', require('./modules/schools/schools.routes'));
app.use('/api/events', require('./modules/events/events.routes'));
app.use('/api/attendees', require('./modules/attendees/attendees.routes'));
app.use('/api/payments', require('./modules/payments/payments.routes'));
// app.use('/api/refunds', require('./modules/refunds/refunds.routes'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

module.exports = app;
