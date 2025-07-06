// validators/authValidator.js
const Joi = require('joi');

exports.registerSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 3 characters'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'string.empty': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'string.empty': 'Password is required'
  })
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'string.empty': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  })
});

exports.updateProfileSchema = Joi.object({
  name: Joi.string().min(3),
  email: Joi.string().email(),
  password: Joi.string().min(6)
});
