// const express = require('express');
// const router = express.Router();
// const {
//   createOrder,
//   getMyOrders,
//   payOrder,
//   createOrderFromCart
// } = require('../controllers/orderController');
// const { authenticateToken } = require('../middleware/auth');

// router.post('/', authenticateToken, createOrder); 
// router.post('/from-cart', authenticateToken, createOrderFromCart); 
// router.get('/my-orders', authenticateToken, getMyOrders);
// router.put('/:id/pay', authenticateToken, payOrder);

// module.exports = router;
// ################

const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  payOrder,
  createOrderFromCart
} = require('../controllers/orderController');
const { optionalAuth } = require('../middleware/optionalAuth');

router.post('/', optionalAuth, createOrder); 
router.post('/from-cart', optionalAuth, createOrderFromCart); 
router.get('/my-orders', optionalAuth, getMyOrders);
router.put('/:id/pay', optionalAuth, payOrder);

module.exports = router;