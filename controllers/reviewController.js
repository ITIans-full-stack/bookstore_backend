const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Review = require("../models/review");
const Book = require("../models/book");
const Order = require("../models/order");


// @desc    Add review to a book
// @route   POST /api/reviews/:bookId
// @access  Private
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const { bookId } = req.params;

  const book = await Book.findById(bookId);
  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }
  const review = new Review({
    rating,
    comment,
    book: bookId,
    user: req.user.id
  });

  const createdReview = await review.save();
  const avg = await Review.aggregate([
    { $match: { book: new mongoose.Types.ObjectId(bookId) } },
    { $group: { _id: "$book", avgRating: { $avg: "$rating" } } }
  ]);

  book.averageRating = avg[0]?.avgRating || 0;
  await book.save();
  res.status(201).json(createdReview);
});

// @desc    Update review
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  if (review.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized");
  }

  review.rating = req.body.rating || review.rating;
  review.comment = req.body.comment || review.comment;

  const updatedReview = await review.save();
  res.json(updatedReview);

});

// @desc    Delete review
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  if (review.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized");
  }

  await review.deleteOne();
  res.json({ message: "Review deleted" });

});

// @desc    Get all reviews for a book
const getReviewsForBook = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ book: req.params.bookId }).populate(
    "user",
    "name"
  );
  res.json(reviews);
});
const canUserReview = asyncHandler(async (req, res) => {
  const { bookId } = req.params;

  const order = await Order.findOne({
    user: req.user.id,
    "books.book": bookId,
    status: "delivered"
  });

  if (order) {
    return res.json({ canReview: true });
  } else {
    return res.status(403).json({ canReview: false });
  }
});


module.exports = {
  addReview,
  updateReview,
  deleteReview,
  getReviewsForBook,
  canUserReview
};
