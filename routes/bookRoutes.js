const express = require('express');
const router = express.Router();
const upload = require('../middleware/uplaod');
const {
  addBook,
  getBookById,
  updateBook,
  deleteBook,
  getAllBooksP
} = require('../controllers/bookController');

// Add , Get , Update , Delete ==> Book
router.post('/', upload.single('image') , addBook);
router.get('/:id', getBookById);
router.put('/:id',upload.single('image') ,updateBook);
router.delete('/:id', deleteBook);
router.get('/', getAllBooksP);

module.exports = router;
