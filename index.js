const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');
// const { notFound, errorHandler } = require('./middleware/errorHandler');
const errorHandler = require('./middleware/errorHandler');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const orderRoutes = require('./routes/orders');


dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// Routes
// app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
// Error Handling
// app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
