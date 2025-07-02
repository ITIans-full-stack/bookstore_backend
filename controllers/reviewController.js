const Review = require("../models/review");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");

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
  res.status(201).json(createdReview);
});

// @desc    Update review
// @route   PUT /api/reviews/:reviewId
// @access  Private
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
// @route   DELETE /api/reviews/:reviewId
// @access  Private
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
// @route   GET /api/reviews/book/:bookId
// @access  Public
const getReviewsForBook = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ book: req.params.bookId }).populate(
    "user",
    "name"
  );
  res.json(reviews);
});

module.exports = {
  addReview,
  updateReview,
  deleteReview,
  getReviewsForBook
};
