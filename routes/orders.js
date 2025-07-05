// const express = require('express');
// const router = express.Router();
// const {
//   createOrder,
//   getMyOrders,
//   payOrder,
//   createOrderFromCart
//   ,cancelOrder,
//   getAllOrders
// } = require('../controllers/orderController');
// const { authenticateToken } = require('../middleware/auth');

// router.post('/', authenticateToken, createOrder); 
// router.post('/from-cart', authenticateToken, createOrderFromCart); 
// router.get('/my-orders', authenticateToken, getMyOrders);
// router.put('/:id/pay', authenticateToken, payOrder);
// router.delete('/:id', authenticateToken, cancelOrder);
// router.get("/all", authenticateToken, getAllOrders);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  createOrderFromCart,
  getOrderById, 
  updateOrderToPaid, 
  getUserOrders, 
  getMyOrders,
  payOrder,
  cancelOrder,
  getAllOrders 
} = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

// create a new order
router.post('/',authenticateToken, createOrder);

// greate an order from the cart
router.post('/cart', authenticateToken, createOrderFromCart);

// get user orders
router.get('/myorders', authenticateToken, getMyOrders);

// get all requests (for admin)
router.get('/admin/orders', authenticateToken, getAllOrders);

// get a specific request
router.get('/:id', authenticateToken, getOrderById);

// update payment status
router.put('/:id/pay', authenticateToken, updateOrderToPaid);

// push the order (to the webhook)
router.post('/pay/:id', authenticateToken, payOrder);

// cancel order
router.delete('/:id', authenticateToken, cancelOrder);

module.exports = router;