const Book = require("../models/book");
const redisClient = require("../config/redisClient");
const { clearBooksPaginationCache } = require("../utils/cache");
const asyncHandler = require("express-async-handler");
const { validateBook } = require("../validation/bookValidation");
const fs = require("fs");
// Add a new book  POST /api/books
const addBook = async (req, res) => {
  try {
    // const image = req.file ? req.file.path : null;
    let image = null;
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      image = `${baseUrl}/${req.file.path.replace(/\\/g, "/")}`;
    }
    const bookData = {
      ...req.body,
      image,
    };
    // Joi validation
    const { error } = validateBook(bookData);
    if (error) {
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(400).json({
        errors: error.details.map((d) => d.message),
      });
    }
    const book = new Book(bookData);

    const createdBook = await book.save();
    await clearBooksPaginationCache();

    res.status(201).json(createdBook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//================================================================================
// Get book by ID  GET /api/books/:id
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (book) {
      res.json(book);
    } else {
      res.status(404).json({ message: "Book not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Invalid Book ID" });
  }
};

//================================================================================
// Update book by id   PUT /api/books/:id
const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }

  const updatedFields = req.body;
  const updatedBook = await Book.findByIdAndUpdate(
    req.params.id,
    updatedFields,
    {
      new: true,
      runValidators: true,
    }
  );
  const bookKey = `book:${req.params.id}`;
  await redisClient.setEx(bookKey, 300, JSON.stringify(updatedBook));
  await clearBooksPaginationCache();
  res.status(200).json({
    success: true,
    message: "Book updated successfully",
    data: updatedBook,
  });
});

//================================================================================
// Delete book by id   DELETE /api/books/:id
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }

  await book.deleteOne();
  await redisClient.del(`book:${req.params.id}`);
  await clearBooksPaginationCache();
  await redisClient.del(`book:${req.params.id}`);
  res.status(200).json({
    success: true,
    message: "Book deleted successfully",
  });
});

//================================================================================

//handel pagination

const getAllBooksP = asyncHandler(async (req, res) => {
 
  const keyword = req.query.keyword
    ? { title: { $regex: req.query.keyword, $options: "i" } }
    : {};
  const keywordValue = req.query.keyword || "";
    const totalBooks = await Book.countDocuments({ ...keyword });

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || totalBooks;
  const redisKey = `books:page=${page}:limit=${limit}:keyword=${keywordValue}`;
  const cachedData = await redisClient.get(redisKey);
  if (cachedData) {
    console.log("Served from Redis cache");
    return res.status(200).json({
      ...JSON.parse(cachedData),
      cache: true,
    });
  }
  const books = await Book.find({ ...keyword })
    .skip((page - 1) * limit)
    .limit(limit);

  const result = {
    success: true,
    message: "Books fetched with pagination",
    page,
    totalBooks,
    totalPages: Math.ceil(totalBooks / limit),
    results: books.length,
    data: books,
    cache:false
  };

  await redisClient.setEx(redisKey, 300, JSON.stringify(result));
  res.status(200).json(result);
});

module.exports = {
  addBook,
  getBookById,
  updateBook,
  deleteBook,
  getAllBooksP,
};
