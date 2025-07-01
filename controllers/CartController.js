const Cart = require('../models/cart');
const Book = require('../models/book');

//  1. get cart
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.book', 'title price image');
    if (!cart) return res.json({ items: [] });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cart' });
  }
};

//  2. add to cart
const addToCart = async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body]; // يدعم الاتنين

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    for (const { bookId, quantity } of items) {
      if (!bookId || !quantity) continue;

      const existingItem = cart.items.find(item => item.book.toString() === bookId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ book: bookId, quantity });
      }
    }

    await cart.save();
    await cart.populate('items.book', 'title price image'); 
    res.status(200).json(cart);

  } catch (err) {
    console.error('Add to Cart Error:', err);
    res.status(500).json({ message: 'Error adding to cart', error: err.message });
  }
};


//  3. remove specific book from cart
const removeFromCart = async (req, res) => {
  try {
    const bookId = req.params.bookId;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.book.toString() !== bookId);
    await cart.save();

    res.json(cart);

  } catch (err) {
    res.status(500).json({ message: 'Error removing item from cart' });
  }
};

//  4. clear entire cart
const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user.id });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Error clearing cart' });
  }
};



module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
 
};
