const authService = require('./auth.service');
const { loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('./auth.validation');

const wantsJson = (req) => {
    if (req.is('application/json')) return true;
    if (req.headers.accept && req.headers.accept.includes('application/json')) return true;
    if (req.headers.accept && req.headers.accept.includes('text/html')) return false;
    return true;
};

exports.renderLogin = (req, res) => {
    if (req.cookies.token) return res.redirect('/admin');
    res.render('auth/login', { error: null });
};

exports.handleLogin = async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            if (wantsJson(req)) return res.status(400).json({ success: false, message: error.details[0].message });
            return res.render('auth/login', { error: error.details[0].message });
        }

        const { token, user } = await authService.loginUser(value.email, value.password);
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        if (wantsJson(req)) return res.status(200).json({ success: true, token, user, message: 'Logged in successfully' });
        res.redirect('/admin');
    } catch (error) {
        if (wantsJson(req)) return res.status(401).json({ success: false, message: error.message });
        res.render('auth/login', { error: error.message || 'An error occurred during login' });
    }
};

exports.renderForgotPassword = (req, res) => {
    res.render('auth/forgot-password', { error: null, success: null });
};

exports.handleForgotPassword = async (req, res) => {
    try {
        const { error, value } = forgotPasswordSchema.validate(req.body);
        if (error) {
            if (wantsJson(req)) return res.status(400).json({ success: false, message: error.details[0].message });
            return res.render('auth/forgot-password', { error: error.details[0].message, success: null });
        }

        await authService.generateResetToken(value.email, req);

        if (wantsJson(req)) return res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
        res.render('auth/forgot-password', { error: null, success: 'Password reset link sent to your email (check console for now).' });
    } catch (error) {
        if (wantsJson(req)) return res.status(400).json({ success: false, message: error.message });
        res.render('auth/forgot-password', { error: error.message || 'An error occurred', success: null });
    }
};

exports.renderResetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        await authService.validateResetToken(token);
        res.render('auth/reset-password', { token, error: null });
    } catch (error) {
        res.send(error.message);
    }
};

exports.handleResetPassword = async (req, res) => {
    const { token } = req.params;
    try {
        const { error, value } = resetPasswordSchema.validate(req.body);
        if (error) {
            if (wantsJson(req)) return res.status(400).json({ success: false, message: error.details[0].message });
            return res.render('auth/reset-password', { token, error: error.details[0].message });
        }

        const user = await authService.validateResetToken(token);
        await authService.resetPassword(user, value.password);

        if (wantsJson(req)) return res.status(200).json({ success: true, message: 'Password reset successful' });
        res.redirect('/admin/login');
    } catch (error) {
        if (wantsJson(req)) return res.status(400).json({ success: false, message: error.message });
        res.render('auth/reset-password', { token, error: error.message || 'An error occurred' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    if (wantsJson(req)) return res.status(200).json({ success: true, message: 'Logged out successfully' });
    res.redirect('/admin/login');
};
