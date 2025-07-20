/**
 * @swagger
 * components:
 *   schemas:
 *     Book:
 *       type: object
 *       required:
 *         - title
 *         - author
 *         - price
 *         - category
 *         - description
 *         - stock
 *         - image
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the book
 *         title:
 *           type: string
 *         author:
 *           type: string
 *         price:
 *           type: number
 *         discount:
 *           type: number
 *         category:
 *           type: array
 *           items:
 *             type: string
 *         description:
 *           type: string
 *         stock:
 *           type: number
 *         image:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         pdf:
 *           type: string
 *         averageRating:
 *           type: number
 *       example:
 *         title: "Sample Book"
 *         author: "Jane Doe"
 *         price: 19.99
 *         discount: 10
 *         category: ["Fiction"]
 *         description: "An amazing book"
 *         stock: 5
 *         image: "book.jpg"
 *         images: ["img1.jpg", "img2.jpg"]
 *         pdf: "sample.pdf"
 *         averageRating: 4.2
 */

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get all books
 *     tags: [Book]
 *     responses:
 *       200:
 *         description: List of books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 */

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Add a new book
 *     tags: [Book]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - price
 *               - description
 *               - category
 *               - stock
 *               - image
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               price:
 *                 type: number
 *               discount:
 *                 type: number
 *               category:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               stock:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               pdf:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Book created successfully
 */


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
  getAllAuthors,
  searchBooksByType
} = require('../controllers/bookController');

// Add , Get , Update , Delete ==> Book
router.post('/', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 5 },
  { name: "pdf", maxCount: 1 }
]), addBook);
router.get("/categories", getAllCategories);
router.get('/authors', getAllAuthors);
router.get("/search", searchBooksByType);
router.get('/top-sales', getTopSalesBooks);
router.get('/top-rated', getTopRatedBooks);
router.get('/newest', getNewestBooks); 
router.get('/:id/related', getRelatedBooks);
router.get('/:id', getBookById);
router.put('/:id',upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 5 },
  { name: "pdf", maxCount: 1 }
]),updateBook);
router.delete('/:id', deleteBook);
router.get('/', getAllBooksP);


module.exports = router;
