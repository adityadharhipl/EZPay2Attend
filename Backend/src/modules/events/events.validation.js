const Joi = require('joi');

exports.createEventSchema = Joi.object({
    schoolId: Joi.string().uuid().required(),
    title: Joi.string().min(3).max(255).required(),
    description: Joi.string().optional().allow('', null),
    status: Joi.string().valid('OPEN', 'CLOSED', 'COMPLETED', 'CANCELLED').default('OPEN'),
    capacity: Joi.number().integer().min(1).required(),
    depositPercentage: Joi.number().min(0).max(100).default(0),
    balanceDueDate: Joi.date().iso().optional().allow(null),
    costPerAttendee: Joi.number().min(0).required(),
    venue: Joi.string().optional().allow('', null),
    type: Joi.string().optional().allow('', null),
    date: Joi.date().iso().optional().allow(null)
});

exports.updateEventSchema = Joi.object({
    schoolId: Joi.string().uuid().optional(),
    title: Joi.string().min(3).max(255).optional(),
    description: Joi.string().optional().allow('', null),
    status: Joi.string().valid('OPEN', 'CLOSED', 'COMPLETED', 'CANCELLED').optional(),
    capacity: Joi.number().integer().min(1).optional(),
    depositPercentage: Joi.number().min(0).max(100).optional(),
    balanceDueDate: Joi.date().iso().optional().allow(null),
    costPerAttendee: Joi.number().min(0).optional(),
    venue: Joi.string().optional().allow('', null),
    type: Joi.string().optional().allow('', null),
    date: Joi.date().iso().optional().allow(null)
}).min(1); // Require at least one field to be updated
