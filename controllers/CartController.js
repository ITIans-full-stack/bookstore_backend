// const getUserId = (req) => {
//   return req.user?.id || '686582df5089128001ab4fc8' ; // لو فيه user استخدمه، لو لأ استخدم session
// };
// // ########################


// const Cart = require('../models/cart');
// const Book = require('../models/book');

// //  1. get cart
// const getCart = async (req, res) => {
//   try {
//     // const cart = await Cart.findOne({ user: req.user.id }).populate('items.book', 'title price image');###
//         const cart = await Cart.findOne({ user: getUserId(req)  }).populate('items.book', 'title price image');

//     if (!cart) return res.json({ items: [] });
//     res.json(cart);
//   } catch (err) {
//     res.status(500).json({ message: 'Error fetching cart' });
//   }
// };

// //  2. add to cart
// const addToCart = async (req, res) => {
//   try {
//     const items = Array.isArray(req.body) ? req.body : [req.body];

//     // let cart = await Cart.findOne({ user: req.user.id });##
//         let cart = await Cart.findOne({ user:  getUserId(req) });


//     if (!cart) {
//         cart = new Cart({ user: getUserId(req), items: [] });

//       // cart = new Cart({ user: req.user.id, items: [] });####
//     }

//     for (const { bookId, quantity } of items) {
//       if (!bookId || !quantity) continue;

//       const existingItem = cart.items.find(item => item.book.toString() === bookId);
//       if (existingItem) {
//         existingItem.quantity += quantity;
//       } else {
//         cart.items.push({ book: bookId, quantity });
//       }
//     }

//     await cart.save();
//     await cart.populate('items.book', 'title price image'); 
//     res.status(200).json(cart);

//   } catch (err) {
//     console.error('Add to Cart Error:', err);
//     res.status(500).json({ message: 'Error adding to cart', error: err.message });
//   }
// };


// //  3. remove specific book from cart
// const removeFromCart = async (req, res) => {
//   try {
//     const bookId = req.params.bookId;

//     // const cart = await Cart.findOne({ user: req.user.id });##
//         const cart = await Cart.findOne({ user:  getUserId(req) });

//     if (!cart) return res.status(404).json({ message: 'Cart not found' });

//     cart.items = cart.items.filter(item => item.book.toString() !== bookId);
//     await cart.save();

//     res.json(cart);

//   } catch (err) {
//     res.status(500).json({ message: 'Error removing item from cart' });
//   }
// };

// //  4. clear entire cart
// const clearCart = async (req, res) => {
//   try {
//     // await Cart.findOneAndDelete({ user: req.user.id });##
//         await Cart.findOneAndDelete({ user:  getUserId(req) });

//     res.json({ message: 'Cart cleared' });
//   } catch (err) {
//     res.status(500).json({ message: 'Error clearing cart' });
//   }
// };



// module.exports = {
//   getCart,
//   addToCart,
//   removeFromCart,
//   clearCart,
 
// };
// ############################################ stock

const Cart = require('../models/cart');
const Book = require('../models/book');

const getUserId = (req) => {
  return req.user?.id || '686582df5089128001ab4fc8'; // Use user ID or session
};

// 1. Get cart
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: getUserId(req) }).populate('items.book', 'title price image stock');
    console.log('Fetched cart:', cart); // Logging for debugging
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
    let cart = await Cart.findOne({ user: getUserId(req) });

    if (!cart) {
      cart = new Cart({ user: getUserId(req), items: [] });
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

      console.log(`Processing book: ${book.title}, Requested quantity: ${quantity}, Stock: ${book.stock}`); // Logging for debugging

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
    const cart = await Cart.findOne({ user: getUserId(req) });

    if (!cart) {
      console.warn('Cart not found for user:', getUserId(req));
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
    await Cart.findOneAndDelete({ user: getUserId(req) });
    console.log('Cart cleared for user:', getUserId(req));
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