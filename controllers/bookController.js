const Book = require("../models/book");
const redisClient = require("../config/redisClient");
const { clearBooksPaginationCache } = require("../utils/cache");
const asyncHandler = require("express-async-handler");
const { validateBook } = require("../validation/bookValidation");
const fs = require("fs");
const path = require("path");

// Add a new book  POST /api/books
const addBook = async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    let mainImagePath = null;
    let additionalImagesPaths = [];
    let pdfPath = null;

    // Get temp paths
    if (req.files?.image?.[0]) {
      mainImagePath = req.files.image[0].path;
    }

    if (req.files?.images) {
      additionalImagesPaths = req.files.images.map(f => f.path);
    }

      if (req.files?.pdf?.[0]) {
      pdfPath = req.files.pdf[0].path;
    }

    // Build URLs for Joi validation
    const bookData = {
      ...req.body,
      image: mainImagePath ? `${baseUrl}/${mainImagePath.replace(/\\/g, "/")}` : null,
      images: additionalImagesPaths.map(p => `${baseUrl}/${p.replace(/\\/g, "/")}`),
      pdf: pdfPath ? `${baseUrl}/${pdfPath.replace(/\\/g, "/")}` : null,
    };

    const { error } = validateBook(bookData);
    if (error) {
      // Delete all temp files
      if (mainImagePath) fs.unlinkSync(mainImagePath);
      additionalImagesPaths.forEach(p => fs.unlinkSync(p));
      if (pdfPath) fs.unlinkSync(pdfPath);
      return res.status(400).json({
        errors: error.details.map((d) => d.message),
      });
    }

    const book = new Book(bookData);
    const createdBook = await book.save();

    await clearBooksPaginationCache();

    res.status(201).json(createdBook);
  } catch (error) {
    // Clean up temp files on error
    if (req.files?.image?.[0]?.path) {
      fs.unlink(req.files.image[0].path, () => {});
    }
    if (req.files?.images) {
      req.files.images.forEach(file => fs.unlink(file.path, () => {}));
    }
      if (req.files?.pdf?.[0]?.path) {
      fs.unlink(req.files.pdf[0].path, () => {});
    }

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
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }

  const mainImagePath = req.files?.image?.[0]?.path || null;
  const newImagePaths = req.files?.images?.map(f => f.path) || [];
  const pdfPath = req.files?.pdf?.[0]?.path || null;


  let existingImageUrls = [];
  if (Array.isArray(req.body['images[]'])) {
    existingImageUrls = req.body['images[]'];
  } else if (Array.isArray(req.body.images)) {
    existingImageUrls = req.body.images;
  } else if (typeof req.body.images === 'string') {
    existingImageUrls = [req.body.images];
  }

  const allImages = [
    ...existingImageUrls,
    ...newImagePaths.map(p => `${baseUrl}/${p.replace(/\\/g, "/")}`)
  ];

  const updatedImage = mainImagePath
    ? `${baseUrl}/${mainImagePath.replace(/\\/g, "/")}`
    : book.image; 

    //  const updatedPdf = pdfPath
    // ? `${baseUrl}/${pdfPath.replace(/\\/g, "/")}`
    // : book.pdf;

    let updatedPdf = book.pdf;

// Handle explicit PDF removal
if (req.body.removePdf === 'true' && book.pdf) {
  const oldPdf = path.join(__dirname, '..', 'uploads', path.basename(book.pdf));
  if (fs.existsSync(oldPdf)) fs.unlinkSync(oldPdf);
  updatedPdf = null;
}

// Handle replacing PDF
if (pdfPath) {
  // If replacing, delete the old one
  if (book.pdf) {
    const oldPdf = path.join(__dirname, '..', 'uploads', path.basename(book.pdf));
    if (fs.existsSync(oldPdf)) fs.unlinkSync(oldPdf);
  }

  updatedPdf = `${baseUrl}/${pdfPath.replace(/\\/g, "/")}`;
}


  const updatedData = {
    ...req.body,
    image: updatedImage,
    images: allImages,
    pdf: updatedPdf
  };
  


  const { error } = validateBook(updatedData);
  if (error) {
    if (mainImagePath) fs.unlinkSync(mainImagePath);
    newImagePaths.forEach(p => fs.unlinkSync(p));
    return res.status(400).json({
      errors: error.details.map(d => d.message),
    });
  }

  if (mainImagePath && book.image) {
    const oldMain = path.join(__dirname, '..', 'uploads', path.basename(book.image));
    if (fs.existsSync(oldMain)) fs.unlinkSync(oldMain);
  }

   // Delete old PDF if replaced
  if (pdfPath && book.pdf) {
    const oldPdf = path.join(__dirname, '..', 'uploads', path.basename(book.pdf));
    if (fs.existsSync(oldPdf)) fs.unlinkSync(oldPdf);
  }


  const updatedBook = await Book.findByIdAndUpdate(
    req.params.id,
    updatedData,
    { new: true, runValidators: true }
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

if (book.image) {
    const imagePath = path.join(__dirname, '..', 'uploads', path.basename(book.image));
    fs.unlink(imagePath, (err) => {
  if (err) {
    console.error(`Failed to delete image file: ${imagePath}`, err.message);
  }
});
  }


  await Book.findByIdAndDelete(req.params.id);
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
//-----------------------------------
//get related books
const getRelatedBooks = asyncHandler(async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const relatedBooks = await Book.find({
      _id: { $ne: book._id },
      category: { $in: book.category }
    }).limit(6);

    res.json(relatedBooks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//================================================================================
// Get all unique categories from books   GET /api/books/categories
const getAllCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await Book.aggregate([
      { $unwind: "$category" },
      { $group: { _id: "$category" } },
      { $sort: { _id: 1 } }
    ]);

    const categoryList = categories.map(cat => cat._id); 

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categoryList,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});
// GET /api/books/top-sales
const getTopSalesBooks = asyncHandler(async (req, res) => {
  const books = await Book.find().sort({ discount: -1 }).limit(7);
  res.status(200).json({
    success: true,
    message: 'Top sales books fetched successfully',
    data: books,
  });
});
// GET /api/books/top-rated
const getTopRatedBooks = asyncHandler(async (req, res) => {
  const books = await Book.find().sort({ averageRating: -1 }).limit(4);
  res.status(200).json({
    success: true,
    message: 'Top rated books fetched successfully',
    data: books,
  });
});
// GET /api/books/newest
const getNewestBooks = asyncHandler(async (req, res) => {
  const books = await Book.find().sort({ createdAt: -1 }).limit(5);
  res.status(200).json({
    success: true,
    message: 'Newest books fetched successfully',
    data: books,
  });
});

// GET /api/books/authors
const getAllAuthors = asyncHandler(async (req, res) => {
  try {
    const authors = await Book.distinct('author');

    // Normalize and de-duplicate case-insensitive authors
    const authorMap = new Map();
    authors.forEach(author => {
      if (author && typeof author === 'string') {
        const formatted = author.trim(); // Or apply your own formatCategoryName()
        const key = formatted.toLowerCase();
        if (!authorMap.has(key)) {
          authorMap.set(key, formatted);
        }
      }
    });

    const uniqueAuthors = Array.from(authorMap.values());

    res.status(200).json({
      success: true,
      message: 'Authors fetched successfully',
      data: uniqueAuthors,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch authors' });
  }
});

//=============================================================================
// GET /api/books/search?type=title&keyword=magic

const searchBooksByType = asyncHandler(async (req, res) => {
  const { type, keyword } = req.query;

  if (!type || !keyword) {
    return res.status(400).json({
      success: false,
      message: "Missing 'type' or 'keyword' query parameters",
    });
  }

  const allowedTypes = ["title", "author", "category"];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid search type. Allowed types: ${allowedTypes.join(", ")}`,
    });
  }

  const trimmedKeyword = keyword.trim();
  let filter = {};

  if (type === "category") {
    // category is an array, so use $elemMatch
    filter = {
      category: {
        $elemMatch: { $regex: trimmedKeyword, $options: "i" }
      }
    };
  } else {
    filter = {
      [type]: { $regex: trimmedKeyword, $options: "i" }
    };
  }

  try {
    const books = await Book.find(filter);

    res.status(200).json({
      success: true,
      message: `Books found for ${type} matching "${trimmedKeyword}"`,
      results: books.length,
      data: {
        books: books, // This is the array, but wrapped inside "data"
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});






module.exports = {
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
};
