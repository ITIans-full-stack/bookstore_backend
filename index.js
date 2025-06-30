const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const bookRoutes = require('./routes/bookRoutes');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
dotenv.config();
connectDB();


const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, './uploads')));
app.use('/api/books', bookRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
