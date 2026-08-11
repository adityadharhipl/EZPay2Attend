const Joi = require('joi');

const updateProfileSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).optional().allow(''),
    confirmPassword: Joi.any().valid(Joi.ref('password')).messages({
        'any.only': 'Passwords do not match'
    })
});

module.exports = {
    updateProfileSchema
};
