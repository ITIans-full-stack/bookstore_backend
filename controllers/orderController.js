const Cart = require("../models/cart");
const mongoose = require("mongoose");
const Order = require("../models/order");
const Book = require("../models/book");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");

const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { books } = req.body;
    const userId = req.user.id;

    let totalPrice = 0;

    for (let item of books) {
      const book = await Book.findById(item.book).session(session);
      if (!book) {
        throw new Error(`Book with id ${item.book} not found`);
      }
      if (book.stock < item.quantity) {
        throw new Error(`Not enough stock for book: ${book.title}`);
      }

      // stock
      book.stock -= item.quantity;
      await book.save({ session });

      totalPrice += book.price * item.quantity;
    }

    const newOrder = new Order({
      user: userId,
      books,
      totalPrice,
      isPaid: false,
    });

    await newOrder.save({ session });

    await session.commitTransaction();
    session.endSession();
    const user = await User.findById(userId);
    const bookListText = books
      .map((b) => `- ${b.quantity} x ${b.book}`)
      .join("\n");
    const bookListHTML = books
      .map((b) => `<li>${b.quantity} x ${b.book}</li>`)
      .join("");

    const emailText = `Thank you for your order!\n\nOrder ID: ${
      newOrder._id
    }\nTotal: $${totalPrice.toFixed(2)}\nBooks:\n${bookListText}`;

    const emailHTML = `
            <h2>Thank you for your order!</h2>
            <p><strong>Order ID:</strong> ${newOrder._id}</p>
            <p><strong>Total:</strong> $${totalPrice.toFixed(2)}</p>
            <p><strong>Books:</strong></p>
            <ul>${bookListHTML}</ul>
          `;
    await sendEmail(user.email, "Order Confirmation", emailText, emailHTML);
    const io = req.app.get("io");
    io.emit("orderCreated", {
      orderId: newOrder._id,
      user: userId,
      totalPrice,
      books,
    });

    res.status(201).json(newOrder);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};
// order view
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("books.book", "title price image")
      .exec();

    const totalOrders = await Order.countDocuments({ user: userId });

    res.json({
      page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

const payOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId)
      .populate("books.book")
      .session(session);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.isPaid) {
      throw new Error("Order already paid");
    }

    for (let item of order.books) {
      const book = item.book;

      if (book.stock < item.quantity) {
        throw new Error(`Not enough stock for book: ${book.title}`);
      }

      book.stock -= item.quantity;
      await book.save({ session });
    }

    order.isPaid = true;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res
      .status(200)
      .json({ message: "Payment confirmed and stock updated", order });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};
// create order from cart

const createOrderFromCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId })
      .populate("items.book")
      .session(session);

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    let totalPrice = 0;
    const books = [];

    for (let item of cart.items) {
      const book = item.book;
      if (!book) {
        throw new Error("Book not found");
      }

      if (book.stock < item.quantity) {
        throw new Error(`Not enough stock for book: ${book.title}`);
      }

      book.stock -= item.quantity;
      await book.save({ session });

      totalPrice += book.price * item.quantity;
      books.push({ book: book._id, quantity: item.quantity });
    }

    const newOrder = new Order({
      user: userId,
      books,
      totalPrice,
      isPaid: false,
    });

    await newOrder.save({ session });

    await Cart.findOneAndDelete({ user: userId }).session(session);

    await session.commitTransaction();
    session.endSession();

    const user = await User.findById(userId);

    const bookListText = books
      .map((b) => `- ${b.quantity} x ${b.book}`)
      .join("\n");

    const bookListHTML = books
      .map((b) => `<li>${b.quantity} x ${b.book}</li>`)
      .join("");

    const emailText = `Thank you for your order!\n\nOrder ID: ${
      newOrder._id
    }\nTotal: $${totalPrice.toFixed(2)}\nBooks:\n${bookListText}`;

    const emailHTML = `
          <h2>Thank you for your order!</h2>
          <p><strong>Order ID:</strong> ${newOrder._id}</p>
          <p><strong>Total:</strong> $${totalPrice.toFixed(2)}</p>
          <p><strong>Books:</strong></p>
          <ul>${bookListHTML}</ul>
        `;

    await sendEmail(user.email, "Order Confirmation", emailText, emailHTML);

    res
      .status(201)
      .json({ message: "Order created from cart", order: newOrder });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};
module.exports = {
  createOrder,
  getMyOrders,
  payOrder,
  createOrderFromCart,
};
