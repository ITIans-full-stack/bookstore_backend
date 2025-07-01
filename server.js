const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const bookRoutes = require('./routes/bookRoutes');

const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRouters');

dotenv.config();
connectDB();


const app = express();
app.use(express.json());

app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, './uploads')));
app.use('/api/books', bookRoutes);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', authRoutes);
app.use('/api/cart', cartRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
