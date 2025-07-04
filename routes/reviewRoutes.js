const express = require("express");
const router = express.Router();
const {
  addReview,
  updateReview,
  deleteReview,
  getReviewsForBook,
  canUserReview
} = require("../controllers/reviewController");
const {authenticateToken} = require("../middleware/auth"); 

// Add review
router.post("/:bookId", authenticateToken, addReview);

// Update review
router.put("/:reviewId", authenticateToken, updateReview);

// Delete review
router.delete("/:reviewId", authenticateToken, deleteReview);

// Get all reviews for a book
router.get("/book/:bookId", getReviewsForBook);

router.get('/can-review/:bookId', authenticateToken, canUserReview);


module.exports = router;
