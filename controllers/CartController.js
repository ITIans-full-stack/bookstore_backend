const Cart = require('../models/cart');
const Book = require('../models/book');

// 1. Get cart
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.book', 'title price image stock');
    // console.log('Fetched cart:', cart);  Logging for debugging
    if (!cart) return res.json({ items: [] });
    res.json(cart);
  } catch (err) {
    console.error('Error fetching cart:', err.message);
    res.status(500).json({ message: 'Error fetching cart', error: err.message });
  }
};

// 2. Add to cart
const addToCart = async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({ user:req.user.id, items: [] });
    }

    for (const { bookId, quantity } of items) {
      if (!bookId || !quantity) {
        console.warn('Invalid item data:', { bookId, quantity });
        continue;
      }

      // Check book and stock
      const book = await Book.findById(bookId);
      if (!book) {
        console.warn('Book not found:', bookId);
        return res.status(404).json({ message: `Book with ID ${bookId} not found` });
      }

      console.log(`Processing book: ${book.title}, Requested quantity: ${quantity}, Stock: ${book.stock}`); 

      const existingItem = cart.items.find(item => item.book.toString() === bookId);
      let newQuantity = quantity;

      if (existingItem) {
        newQuantity = existingItem.quantity + quantity;
        if (newQuantity > book.stock) {
          console.log(`Stock limit exceeded for ${book.title}. Requested: ${newQuantity}, Available: ${book.stock}`);
          return res.status(400).json({
            message: `Cannot add ${newQuantity} of ${book.title}. Only ${book.stock} items in stock.`
          });
        }
        if (newQuantity <= 0) {
          console.log(`Removing item ${book.title} from cart (quantity <= 0)`);
          cart.items = cart.items.filter(item => item.book.toString() !== bookId);
        } else {
          existingItem.quantity = newQuantity;
          console.log(`Updated quantity for ${book.title} to ${newQuantity}`);
        }
      } else {
        if (quantity > book.stock) {
          console.log(`Stock limit exceeded for ${book.title}. Requested: ${quantity}, Available: ${book.stock}`);
          return res.status(400).json({
            message: `Cannot add ${quantity} of ${book.title}. Only ${book.stock} items in stock.`
          });
        }
        if (quantity > 0) {
          cart.items.push({ book: bookId, quantity });
          console.log(`Added ${book.title} to cart with quantity ${quantity}`);
        }
      }
    }

    await cart.save();
    await cart.populate('items.book', 'title price image stock');
    res.status(200).json(cart);
  } catch (err) {
    console.error('Add to Cart Error:', err.message);
    res.status(500).json({ message: 'Error adding to cart', error: err.message });
  }
};

// 3. Remove specific book from cart
const removeFromCart = async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      console.warn('Cart not found for user:', req.user.id);
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.book.toString() !== bookId);
    await cart.save();
    await cart.populate('items.book', 'title price image stock');
    console.log('Removed item from cart:', bookId);
    res.json(cart);
  } catch (err) {
    console.error('Error removing item from cart:', err.message);
    res.status(500).json({ message: 'Error removing item from cart', error: err.message });
  }
};

// 4. Clear entire cart
const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user.id });
    console.log('Cart cleared for user:', req.user.id);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    console.error('Error clearing cart:', err.message);
    res.status(500).json({ message: 'Error clearing cart', error: err.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
};