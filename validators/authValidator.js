// validators/authValidator.js
// const Joi = require('joi');

// exports.registerSchema = Joi.object({
//   name: Joi.string().min(3).required().messages({
//     'string.empty': 'Name is required',
//     'string.min': 'Name must be at least 3 characters'
//   }),
//   email: Joi.string().email().required().messages({
//     'string.email': 'Invalid email format',
//     'string.empty': 'Email is required'
//   }),
//   password: Joi.string().min(6).required().messages({
//     'string.min': 'Password must be at least 6 characters',
//     'string.empty': 'Password is required'
//   })
// });

// exports.loginSchema = Joi.object({
//   email: Joi.string().email().required().messages({
//     'string.email': 'Invalid email format',
//     'string.empty': 'Email is required'
//   }),
//   password: Joi.string().required().messages({
//     'string.empty': 'Password is required'
//   })
// });

// exports.updateProfileSchema = Joi.object({
//   name: Joi.string().min(3),
//   email: Joi.string().email(),
//   password: Joi.string().min(6)
// });

// validators/authValidator.js
const Joi = require('joi');

// Password must include:
// - Min 8 characters
// - At least one uppercase
// - At least one lowercase
// - At least one number
// - At least one special character

const strongPassword = Joi.string()
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&])[A-Za-z\\d!@#$%^&]{8,}$'))
  .required()
  .messages({
    'string.pattern.base': 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
    'string.empty': 'Password is required'
  });


exports.registerSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 3 characters'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'string.empty': 'Email is required'
  }),
  password: strongPassword
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
  password: Joi.string()
    .pattern(new RegExp('^(?=.[a-z])(?=.[A-Z])(?=.\d)(?=.[!@#$%^&])[A-Za-z\d!@#$%^&]{8,}$'))
    .messages({
      'string.pattern.base': 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
    })
});
