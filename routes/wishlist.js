const express = require("express");
const router = express.Router();
const Wishlist = require("../models/Wishlist");

router.post("/", async (req, res) => {
  const { userId, bookId } = req.body;

  try {
    const exists = await Wishlist.findOne({ userId, book: bookId });
    if (exists) {
      return res.status(409).json({ message: "Book already in wishlist" });
    }

    const entry = await Wishlist.create({ userId, book: bookId });
    const populated = await entry.populate("book");
    res.status(201).json(populated);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to add to wishlist", details: err.message });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const wishlist = await Wishlist.find({
      userId: req.params.userId,
    }).populate("book");
    res.json(wishlist);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch wishlist", details: err.message });
  }
});

router.delete("/:itemId", async (req, res) => {
  try {
    await Wishlist.findByIdAndDelete(req.params.itemId);
    res.json({ message: "Wishlist item removed" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete item", details: err.message });
  }
});

module.exports = router;
