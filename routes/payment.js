// // const express = require('express');
// // const Stripe = require('stripe');
// // const bodyParser = require('body-parser');
// // const { payOrder } = require('../controllers/orderController'); 
// // require('dotenv').config();

// // const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
// // const router = express.Router();

// // router.post('/create-checkout-session', async (req, res) => {
// //   const { items, orderId, userId } = req.body;

// //   try {
// //     const session = await stripe.checkout.sessions.create({
// //       payment_method_types: ['card'],
// //       mode: 'payment',
// //       line_items: items.map(item => ({
// //         price_data: {
// //           currency: 'usd',
// //           product_data: {
// //             name: item.name,
// //           },
// //           unit_amount: item.price * 100,
// //         },
// //         quantity: item.quantity,
// //       })),
// //     success_url: `http://localhost:4200/payment-result?status=success&orderId=${orderId}`,
// //     cancel_url: `http://localhost:4200/payment-result?status=cancel&orderId=${orderId}`,


      
// //       metadata: {
// //         orderId,
// //         userId
// //       }
// //     });

// //     res.json({ url: session.url });
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
// //   const sig = req.headers['stripe-signature'];

// //   let event;
// //   try {
// //     event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
// //   } catch (err) {
// //     return res.status(400).send(`Webhook Error: ${err.message}`);
// //   }

// //   if (event.type === 'checkout.session.completed') {
// //     const session = event.data.object;

// //     const orderId = session.metadata.orderId;
// //     const userId = session.metadata.userId;

// //     req.params = { id: orderId };
// //     req.user = { id: userId };

// //     try {
// //       await payOrder(req, res);
// //     } catch (error) {
// //       console.error("payOrder failed", error.message);
// //     }
// //   }

// //   res.status(200).json({ received: true });
// // });

// // module.exports = router;

// const express = require('express');
// const Stripe = require('stripe');
// const { payOrder } = require('../controllers/orderController'); 
// require('dotenv').config();

// const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
// const router = express.Router();

// router.post('/create-checkout-session', async (req, res) => {
//   const { items, orderId, userId } = req.body;

//   try {
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       mode: 'payment',
//       line_items: items.map(item => ({
//         price_data: {
//           currency: 'usd',
//           product_data: {
//             name: item.name,
//           },
//           unit_amount: item.price * 100,
//         },
//         quantity: item.quantity,
//       })),
//       success_url: `http://localhost:4200/payment-result?status=success&orderId=${orderId}`,
//       cancel_url: `http://localhost:4200/payment-result?status=cancel&orderId=${orderId}`,
//       metadata: { orderId, userId }
//     });

//     res.json({ url: session.url });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;
const express = require('express');
const Stripe = require('stripe');
require('dotenv').config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.post('/create-checkout-session', async (req, res) => {
  const { items, orderId, userId } = req.body;

  console.log("🛒 Creating checkout session for:", { orderId, userId });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
          },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      })),
      success_url: `http://localhost:4200/payment-result?status=success&orderId=${orderId}`,
      cancel_url: `http://localhost:4200/payment-result?status=cancel&orderId=${orderId}`,
      metadata: { 
        orderId: orderId.toString(), 
        userId: userId.toString() 
      }
    });

    console.log("✅ Checkout session created:", session.id);
    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Error creating checkout session:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;