const express = require('express');
const router = express.Router();
const {
  addBook,
//   getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  getAllBooksP
} = require('../controllers/bookController');

// Add Book
router.post('/', addBook);

// Get All Books
// router.get('/', getAllBooks);

// Get Book By ID
router.get('/:id', getBookById);

// Update Book By ID
router.put('/:id', updateBook);

// Delete Book By ID
router.delete('/:id', deleteBook);


// Get All Books pagination handeling
router.get('/', getAllBooksP);

module.exports = router;
