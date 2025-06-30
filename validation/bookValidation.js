
const Joi = require('joi');
const mongoose = require('mongoose');


const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};
const reviewSchema = Joi.object({
  user: Joi.string().custom(objectId).required(),
  rating: Joi.number().min(1).max(5).required(),
  review: Joi.string().max(500).optional(),
  createdAt: Joi.date().optional(),
});
const bookSchema = Joi.object({
  title: Joi.string().trim().required(),
  author: Joi.string().required(),
  price: Joi.number().min(0).required(),
  discount: Joi.number().min(0).max(70).optional(),
  description: Joi.string().required(),
  stock: Joi.number().min(0).required(),
  image: Joi.string().required(),
  reviews: Joi.array().items(reviewSchema).optional(),
});

module.exports = {
  validateBook: (data) => bookSchema.validate(data, { abortEarly: false }),
};
