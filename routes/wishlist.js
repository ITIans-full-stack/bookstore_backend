const express = require("express");
const router = express.Router();
const Wishlist = require("../models/Wishlist");
router.post("/", async (req, res) => {
  const { user, bookId } = req.body; // <-- change here

  try {
    const exists = await Wishlist.findOne({ user, book: bookId }); // <-- change here
    if (exists) {
      return res.status(409).json({ message: "Book already in wishlist" });
    }

    const entry = await Wishlist.create({ user, book: bookId }); // <-- change here
    await entry.populate("book"); // populate in-place
    res.status(201).json(entry);
  } catch (err) {
    console.error("Wishlist POST error:", err);
    res
      .status(500)
      .json({ error: "Failed to add to wishlist", details: err.message });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const wishlist = await Wishlist.find({
      user: req.params.userId, // <-- change here from userId to user
    }).populate("book");
    res.json(wishlist);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch wishlist", details: err.message });
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
