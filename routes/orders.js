const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  payOrder,
  createOrderFromCart
  ,cancelOrder
} = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, createOrder); 
router.post('/from-cart', authenticateToken, createOrderFromCart); 
router.get('/my-orders', authenticateToken, getMyOrders);
router.put('/:id/pay', authenticateToken, payOrder);
router.delete('/:id', authenticateToken, cancelOrder);

module.exports = router;
