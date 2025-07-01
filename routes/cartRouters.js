const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  removeFromCart,
  clearCart
} = require('../controllers/CartController');

router.get('/', authenticateToken, getCart);
// add to cart
router.post('/add', authenticateToken, addToCart);
// delete from cart
router.delete('/remove/:bookId', authenticateToken, removeFromCart);

router.delete('/clear', authenticateToken, clearCart);

module.exports = router;
