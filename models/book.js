const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    review: {
      type: String,
      maxlength: 500,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    discount: {
      type: Number,
      default:0,
      min: [0, 'Discount must be positive'],
      max:[70,'Discount cant be more than 70 ']
    },
    category: {
      type: String,
      required: [true, 'Book category is required'],
    },
    description: {
      type: String,
      required: [true, 'Book description is required'],
    },
    stock: {
      type: Number,
      required: [true, 'Book stock is required'],
      min: [0, 'Stock cannot be negative'],
    },
    image: {
      type: String, 
      required: [true, 'Book image is required'],
    },
     averageRating: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
  }
);

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
