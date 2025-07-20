const Cart = require("../models/cart");
const mongoose = require("mongoose");
const Order = require("../models/order");
const Book = require("../models/book");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

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
    const bookDetails = [];

    for (let item of cart.items) {
      const book = item.book;
      if (!book) {
        throw new Error("Book not found");
      }
      totalPrice += book.price * item.quantity;
      books.push({ book: book._id, quantity: item.quantity });
      bookDetails.push({ title: book.title, quantity: item.quantity });
    }

    const newOrder = new Order({
      user: userId,
      books,
      totalPrice,
      isPaid: false,
      status: 'pending',
    });

    await newOrder.save({ session });

    // Send initial order confirmation email
    try {
      console.log("🔍 Fetching user for initial order email, userId:", userId);
      const user = await User.findById(userId).session(session);
      if (!user || !user.email) {
        console.error(" User not found or no email for userId:", userId);
      } else {
        const bookListText = bookDetails
          .map((b) => `- ${b.quantity} x ${b.title}`)
          .join("\n");
        const bookListHTML = bookDetails
          .map((b) => `<li>${b.quantity} x ${b.title}</li>`)
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

        console.log(" Preparing to send initial order email to:", user.email);
        await sendEmail(user.email, "Order Created", emailText, emailHTML);
        console.log(" Initial order email sent successfully to:", user.email);
      }
    } catch (emailError) {
      console.error(" Failed to send initial order email:", {
        error: emailError.message,
        stack: emailError.stack,
        userId
      });
    }

    await session.commitTransaction();
    await session.endSession();

    res
      .status(201)
      .json({ message: "Order created from cart", order: newOrder });
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    console.error("Error creating order from cart:", error.message);
    res.status(400).json({ message: error.message });
  }
};

const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { books } = req.body;
    const userId = req.user.id;
    let totalPrice = 0;

    // Fetch book titles for email and socket
    const bookDetails = [];
    for (let item of books) {
      const book = await Book.findById(item.book).session(session);
      if (!book) {
        throw new Error(`Book with id ${item.book} not found`);
      }
      if (book.stock < item.quantity) {
        throw new Error(`Not enough stock for book: ${book.title}`);
      }
      totalPrice += book.price * item.quantity;
      bookDetails.push({ title: book.title, quantity: item.quantity });
    }

    const newOrder = new Order({
      user: userId,
      books,
      totalPrice,
      isPaid: false,
      status: 'pending',
    });

    await newOrder.save({ session });

    await session.commitTransaction();
    await session.endSession();

    try {
      const user = await User.findById(userId);
      const bookListText = bookDetails
        .map((b) => `- ${b.quantity} x ${b.title}`)
        .join("\n");
      const bookListHTML = bookDetails
        .map((b) => `<li>${b.quantity} x ${b.title}</li>`)
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
        books: bookDetails,
        status: newOrder.status,
      });

      res.status(201).json(newOrder);
    } catch (emailError) {
      res.status(201).json({
        message: "Order created, but failed to send email or notification",
        order: newOrder,
        error: emailError.message,
      });
    }
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    res.status(400).json({ message: error.message });
  }
};





const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("books.book", "title price image");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.status = 'paid';
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer ? req.body.payer.email_address : req.user.email
    };

    const updatedOrder = await order.save();
    
    await Cart.findOneAndDelete({ user: req.user.id });

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





const getUserOrders = async (req, res) => {
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

// pay order
const payOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderId = req.params.id;
    const userId = req.user.id;

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
      book.stock = Math.max(0, book.stock - item.quantity);
      await book.save({ session });
      console.log(`Updated stock for ${book.title}: ${book.stock}`);
    }

    const cart = await Cart.findOne({ user: userId }).session(session);
    if (cart) {
      cart.items = cart.items.filter(
        (cartItem) =>
          !order.books.some((orderItem) =>
            orderItem.book._id.equals(cartItem.book)
          )
      );
      await cart.save({ session });
    }

    order.isPaid = true;
    order.status = "completed";
    order.paidAt = Date.now();
    await order.save({ session });

    await session.commitTransaction();
    await session.endSession();

    res
      .status(200)
      .json({ message: "Payment confirmed, cart updated, and stock updated", order });
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    res.status(400).json({ message: error.message });
  }
};


const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).session(session);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.isPaid) {
      throw new Error("Cannot cancel a paid order");
    }
    // Restore stock
    for (let item of order.books) {
      const book = await Book.findById(item.book).session(session);
      if (book) {
        book.stock += item.quantity;
        await book.save({ session });
      }
    }
    // Just update status
    order.status = 'cancelled';
    await order.save({ session });
    // await Order.findByIdAndDelete(orderId).session(session);

    await session.commitTransaction();
    await session.endSession();

    res.status(200).json({ message: "Order cancelled and stock restored" });
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    res.status(400).json({ message: error.message });
  }
};

//all orders for admin 
const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 
    const skip = (page - 1) * limit; 

    const orders = await Order.find()
      .populate("user", "name email")
      .populate("books.book", "title price")
      .sort({ createdAt: -1 }) 
      .skip(skip) 
      .limit(limit) 
      .exec();

    const totalOrders = await Order.countDocuments(); 

    res.json({
      page, 
      totalPages: Math.ceil(totalOrders / limit), 
      totalOrders, 
      orders, 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch all orders", error: error.message });
  }
};

//usre order
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

//single item order
const createOrderForSingleItem = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookId, quantity } = req.body;
    const userId = req.user.id;

    const book = await Book.findById(bookId).session(session);
    if (!book) {
      throw new Error('Book not found');
    }

    if (book.stock < quantity) {
      throw new Error(`Not enough stock for book: ${book.title}`);
    }

    const totalPrice = book.price * quantity;

    const newOrder = new Order({
      user: userId,
      books: [{ book: bookId, quantity }],
      totalPrice,
      isPaid: false,
      status: 'pending',
    });

    await newOrder.save({ session });

    try {
      const user = await User.findById(userId).session(session);
      if (!user || !user.email) {
        console.error('User not found or no email for userId:', userId);
      } else {
        const bookListText = `- ${quantity} x ${book.title}`;
        const bookListHTML = `<li>${quantity} x ${book.title}</li>`;

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

        console.log(' Preparing to send initial order email to:', user.email);
        await sendEmail(user.email, 'Order Created', emailText, emailHTML);
        console.log(' Initial order email sent successfully to:', user.email);
      }
    } catch (emailError) {
      console.error(' Failed to send initial order email:', {
        error: emailError.message,
        stack: emailError.stack,
        userId,
      });
    }

    await session.commitTransaction();
    await session.endSession();

    res
      .status(201)
      .json({ message: 'Order created for single item', order: newOrder });
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    console.error('Error creating order for single item:', error.message);
    res.status(400).json({ message: error.message });
  }

};

module.exports = {
  createOrder,
  createOrderFromCart,
  getOrderById,
  updateOrderToPaid,
  getUserOrders,
  getMyOrders,
  payOrder,
  cancelOrder,
  getAllOrders,
  createOrderForSingleItem,
};