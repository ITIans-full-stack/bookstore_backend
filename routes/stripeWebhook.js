// const express = require("express");
// const router = express.Router();
// const Stripe = require("stripe");
// const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
// const Order = require("../models/order");
// const Cart = require("../models/cart");
// const Book = require("../models/book");
// const mongoose = require("mongoose");

// router.post("/", async (req, res) => {
//   console.log("📥 Webhook received");
//   const sig = req.headers["stripe-signature"];

//   let event;
//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//     console.log("✅ Event verified:", event.type);
//   } catch (err) {
//     console.error("❌ Webhook signature verification failed:", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   if (event.type === "checkout.session.completed") {
//     const session = event.data.object;
//     console.log("💳 Payment completed for session:", session.id);

//     const orderId = session.metadata?.orderId;
//     const userId = session.metadata?.userId;

//     console.log("📋 Order ID:", orderId);
//     console.log("👤 User ID:", userId);

//     if (!orderId || !userId) {
//       console.error("❌ Missing orderId or userId in metadata");
//       return res.sendStatus(400);
//     }

//     const sessionDB = await mongoose.startSession();
//     sessionDB.startTransaction();

//     try {
//       console.log("🔍 Finding order...");
//       const order = await Order.findById(orderId)
//         .populate("books.book")
//         .session(sessionDB);

//       if (!order) {
//         console.error("❌ Order not found:", orderId);
//         throw new Error("Order not found");
//       }

//       console.log("📚 Processing books in order...");
//       for (let item of order.books) {
//         const book = item.book;
//         console.log(`📖 Processing book: ${book.title}, Current stock: ${book.stock}, Requested: ${item.quantity}`);
        
//         if (book.stock >= item.quantity) {
//           book.stock -= item.quantity;
//           await book.save({ session: sessionDB });
//           console.log(`✅ Updated stock for ${book.title}: ${book.stock}`);
//         } else {
//           console.warn(`⚠️ Insufficient stock for ${book.title}, but proceeding with order`);
//           book.stock = Math.max(0, book.stock - item.quantity);
//           await book.save({ session: sessionDB });
//         }
//       }

//       order.isPaid = true;
//       order.status = 'completed'; 
//       order.paymentMethod = 'stripe';
//       order.paidAt = new Date();
//       order.paymentResult = {
//         id: session.payment_intent,
//         status: 'completed',
//         update_time: new Date().toISOString(),
//         email_address: session.customer_details?.email || 'N/A'
//       };
//       await order.save({ session: sessionDB });
//       console.log("✅ Order marked as paid with status:", order.status);

//       // reset the cart
//       const deletedCart = await Cart.findOneAndDelete({ user: userId }).session(sessionDB);
//       console.log("🛒 Cart deleted:", deletedCart ? "Yes" : "No cart found");

//       await sessionDB.commitTransaction();
//       console.log("✅ Transaction committed successfully");
      
//       res.status(200).json({ received: true, orderStatus: order.status });
//     } catch (error) {
//       console.error("❌ Error processing webhook:", error.message);
//       await sessionDB.abortTransaction();
//       res.status(500).json({ message: error.message });
//     } finally {
//       sessionDB.endSession();
//     }
//   } else {
//     console.log("ℹ️ Unhandled event type:", event.type);
//     res.sendStatus(200);
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/order");
const Cart = require("../models/cart");
const Book = require("../models/book");
const mongoose = require("mongoose");
const User = require("../models/User");

router.post("/", async (req, res) => {
  console.log("📥 Webhook received");
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("✅ Event verified:", event.type);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("💳 Payment completed for session:", session.id);

    const orderId = session.metadata?.orderId;
    const userId = session.metadata?.userId;

    console.log("📋 Order ID:", orderId);
    console.log("👤 User ID:", userId);

    if (!orderId || !userId) {
      console.error("❌ Missing orderId or userId in metadata");
      return res.sendStatus(400);
    }

    const sessionDB = await mongoose.startSession();
    sessionDB.startTransaction();

    try {
      console.log("🔍 Finding order...");
      const order = await Order.findById(orderId)
        .populate("books.book")
        .session(sessionDB);

      if (!order) {
        console.error("❌ Order not found:", orderId);
        throw new Error("Order not found");
      }

      console.log("📚 Processing books in order...");
      for (let item of order.books) {
        const book = item.book;
        console.log(`📖 Processing book: ${book.title}, Current stock: ${book.stock}, Requested: ${item.quantity}`);
        
        if (book.stock >= item.quantity) {
          book.stock -= item.quantity;
          await book.save({ session: sessionDB });
          console.log(`✅ Updated stock for ${book.title}: ${book.stock}`);
        } else {
          console.warn(`⚠️ Insufficient stock for ${book.title}, but proceeding with order`);
          book.stock = Math.max(0, book.stock - item.quantity);
          await book.save({ session: sessionDB });
        }
      }

      order.isPaid = true;
      order.status = 'completed';
      order.paymentMethod = 'stripe';
      order.paidAt = new Date();
      order.paymentResult = {
        id: session.payment_intent,
        status: 'completed',
        update_time: new Date().toISOString(),
        email_address: session.customer_details?.email || 'N/A'
      };
      await order.save({ session: sessionDB });
      console.log("✅ Order marked as paid with status:", order.status);

      // Reset the cart
      const deletedCart = await Cart.findOneAndDelete({ user: userId }).session(sessionDB);
      console.log("🛒 Cart deleted:", deletedCart ? "Yes" : "No cart found");

      await sessionDB.commitTransaction();
      console.log("✅ Transaction committed successfully");
      
      res.status(200).json({ received: true, orderStatus: order.status });
    } catch (error) {
      console.error("❌ Error processing webhook:", error.message);
      await sessionDB.abortTransaction();
      res.status(500).json({ message: error.message });
    } finally {
      sessionDB.endSession();
    }
  } else {
    console.log("ℹ️ Unhandled event type:", event.type);
    res.sendStatus(200);
  }
});

module.exports = router;

