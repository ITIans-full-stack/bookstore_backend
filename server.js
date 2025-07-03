const express = require("express");
// const dotenv = require("dotenv");
require('dotenv').config();
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");

const passport = require('passport');


const bookRoutes = require("./routes/bookRoutes");
const orderRoutes = require("./routes/orders");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRouters");
const reviewRoutes = require("./routes/reviewRoutes");
const errorHandler = require("./middleware/errorHandler");
connectDB();




// ====== INIT APP FIRST ======
const app = express();

app.use(express.json());
app.use(cors());

// Static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

// ====== Middleware ======
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(passport.initialize());
require('./config/passport');

app.get('/test-review', (req, res) => {
  res.send('Review Test Route Works!');
});


// Routes
app.use("/api/books", bookRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", authRoutes);
app.use("/api/cart", cartRoutes);
//app.use("/api/auth", require("./routes/authRoutes"));
app.use('/api/auth', authRoutes);
app.use("/api/reviews", reviewRoutes);


// Error Handler Middleware
app.use(errorHandler);

// Server + Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

app.set("io", io);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
