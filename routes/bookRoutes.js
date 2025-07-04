const express = require('express');
const router = express.Router();
const upload = require('../middleware/uplaod');
const {
  addBook,
  getBookById,
  updateBook,
  deleteBook,
  getAllBooksP,
  getRelatedBooks
} = require('../controllers/bookController');

// Add , Get , Update , Delete ==> Book
router.post('/', upload.single('image') , addBook);
router.get('/:id/related', getRelatedBooks);
router.get('/:id', getBookById);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);
router.get('/', getAllBooksP);

module.exports = router;
