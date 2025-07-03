// const express = require('express');
// const router = express.Router();
// const { authenticateToken } = require('../middleware/auth');
// const {
//   getCart,
//   addToCart,
//   removeFromCart,
//   clearCart
// } = require('../controllers/CartController');

// router.get('/', authenticateToken, getCart);
// // add to cart
// router.post('/add', authenticateToken, addToCart);
// // delete from cart
// router.delete('/remove/:bookId', authenticateToken, removeFromCart);

// router.delete('/clear', authenticateToken, clearCart);

// module.exports = router;
//  مؤقت 
const express = require('express');
const router = express.Router();
// استبدلي authenticateToken بـ optionalAuth
const { optionalAuth } = require('../middleware/optionalAuth');
const {
  getCart,
  addToCart,
  removeFromCart,
  clearCart
} = require('../controllers/CartController');

// بلاش توكن إجباري مؤقتًا، استخدمي optionalAuth
router.get('/', optionalAuth, getCart);
router.post('/add', optionalAuth, addToCart);
router.delete('/remove/:bookId', optionalAuth, removeFromCart);
router.delete('/clear', optionalAuth, clearCart);

module.exports = router;
