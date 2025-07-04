const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/order");
const Cart = require("../models/cart");
const Book = require("../models/book");
const mongoose = require("mongoose");

router.post("/", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const orderId = session.metadata?.orderId;
    const userId = session.metadata?.userId;

    if (!orderId || !userId) return res.sendStatus(400);

    const sessionDB = await mongoose.startSession();
    sessionDB.startTransaction();

    try {
      const order = await Order.findById(orderId)
        .populate("books.book")
        .session(sessionDB);

      if (!order) throw new Error("Order not found");

      for (let item of order.books) {
        const book = item.book;
        if (book.stock < item.quantity)
          throw new Error(`Stock not enough for ${book.title}`);
        book.stock -= item.quantity;
        await book.save({ session: sessionDB });
      }

      order.isPaid = true;
      await order.save({ session: sessionDB });

      await Cart.findOneAndDelete({ user: userId }).session(sessionDB);

      await sessionDB.commitTransaction();
      res.status(200).json({ received: true });
    } catch (error) {
      await sessionDB.abortTransaction();
      res.status(500).json({ message: error.message });
    } finally {
      sessionDB.endSession();
    }
  } else {
    res.sendStatus(200);
  }
});

module.exports = router;
