const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const bookRoutes = require("./routes/bookRoutes");
const cors = require("cors");
// const { notFound, errorHandler } = require('./middleware/errorHandler');;

const errorHandler = require("./middleware/errorHandler");
const orderRoutes = require("./routes/orders");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRouters");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// Routes
// app.use('/api/users', userRoutes);
app.use("/api/books", bookRoutes);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", authRoutes);
app.use("/api/cart", cartRoutes);
app.use('/api/auth', require('./routes/authRoutes'));

app.use(cors());

// Error Handling
// app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // for now, allow all origins for development
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
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
