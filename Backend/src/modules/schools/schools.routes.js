const express = require('express');
const schoolsController = require('./schools.controller');
const { authenticate } = require('../../middlewares/authenticate');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Schools
 *   description: Schools management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     School:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         contactPerson:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/schools:
 *   get:
 *     summary: Get all schools (Paginated)
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of schools with pagination
 */
router.get('/', authenticate, schoolsController.getAllSchools);

/**
 * @swagger
 * /api/schools/dropdown:
 *   get:
 *     summary: Get all schools for dropdown selection
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of schools (id and name only)
 */
router.get('/dropdown', authenticate, schoolsController.getAllSchoolsDropdown);

/**
 * @swagger
 * /api/schools/{id}:
 *   get:
 *     summary: Get school by ID
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: School details
 *       404:
 *         description: School not found
 */
router.get('/:id', authenticate, schoolsController.getSchoolById);

/**
 * @swagger
 * /api/schools:
 *   post:
 *     summary: Create a new school
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: School created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, schoolsController.createSchool);

/**
 * @swagger
 * /api/schools/{id}:
 *   patch:
 *     summary: Update a school
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: School updated successfully
 *       404:
 *         description: School not found
 */
router.patch('/:id', authenticate, schoolsController.updateSchool);

/**
 * @swagger
 * /api/schools/{id}:
 *   delete:
 *     summary: Delete a school
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: School deleted successfully
 *       404:
 *         description: School not found
 */
router.delete('/:id', authenticate, schoolsController.deleteSchool);

module.exports = router;
