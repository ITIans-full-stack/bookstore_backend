const express = require('express');
const router = express.Router();
const paypal = require('@paypal/checkout-server-sdk');
require('dotenv').config();


const Environment = paypal.core.SandboxEnvironment;
const paypalClient = new paypal.core.PayPalHttpClient(
  new Environment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
);

router.post('/create-order', async (req, res) => {
  const { total } = req.body;

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: total.toString()
      }
    }]
  });

  try {
    const order = await paypalClient.execute(request);
      const approveLink = order.result.links.find(link => link.rel === 'approve');

     res.json({ id: order.result.id, approveUrl: approveLink.href });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});
// Capture Payment
router.post('/capture-order/:orderId', async (req, res) => {
  const orderId = req.params.orderId;

  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const capture = await paypalClient.execute(request);
    res.json({ message: 'Payment captured successfully', capture });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to capture PayPal payment' });
  }
});

module.exports = router;
