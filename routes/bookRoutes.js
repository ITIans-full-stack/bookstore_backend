const express = require('express');
const router = express.Router();
const upload = require('../middleware/uplaod');
const {
  addBook,
  getBookById,
  updateBook,
  deleteBook,
  getAllBooksP,
  getRelatedBooks,
  getAllCategories,
  getTopSalesBooks,
  getTopRatedBooks,
  getNewestBooks,
  getAllAuthors
} = require('../controllers/bookController');

// Add , Get , Update , Delete ==> Book
router.post('/', upload.single('image') , addBook);
router.get("/categories", getAllCategories);
router.get('/authors', getAllAuthors);
router.get('/top-sales', getTopSalesBooks);
router.get('/top-rated', getTopRatedBooks);
router.get('/newest', getNewestBooks); 
router.get('/:id/related', getRelatedBooks);
router.get('/:id', getBookById);
router.put('/:id',upload.single('image') ,updateBook);
router.delete('/:id', deleteBook);
router.get('/', getAllBooksP);


module.exports = router;
