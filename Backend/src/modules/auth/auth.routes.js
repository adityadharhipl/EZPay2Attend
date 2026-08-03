const express = require('express');
const authController = require('./auth.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication operations
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "superadmin@ezpay2attend.com"
 *               password:
 *                 type: string
 *                 example: "Root@123"
 *     responses:
 *       200:
 *         description: Logged in successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.get('/login', authController.renderLogin);
router.post('/login', authController.handleLogin);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "superadmin@ezpay2attend.com"
 *     responses:
 *       200:
 *         description: Password reset link sent
 *       400:
 *         description: Validation or processing error
 */
router.get('/forgot-password', authController.renderForgotPassword);
router.post('/forgot-password', authController.handleForgotPassword);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token or validation error
 */
router.get('/reset-password/:token', authController.renderResetPassword);
router.post('/reset-password/:token', authController.handleResetPassword);

/**
 * @swagger
 * /api/auth/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.get('/logout', authController.logout);

module.exports = router;
