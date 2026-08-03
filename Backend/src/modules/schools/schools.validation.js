const Joi = require('joi');

exports.createSchoolSchema = Joi.object({
    name: Joi.string().min(2).max(255).required(),
    contactPerson: Joi.string().optional().allow('', null),
    email: Joi.string().email().optional().allow('', null),
    phone: Joi.string().optional().allow('', null),
    address: Joi.string().optional().allow('', null)
});

exports.updateSchoolSchema = Joi.object({
    name: Joi.string().min(2).max(255).optional(),
    contactPerson: Joi.string().optional().allow('', null),
    email: Joi.string().email().optional().allow('', null),
    phone: Joi.string().optional().allow('', null),
    address: Joi.string().optional().allow('', null)
}).min(1);
