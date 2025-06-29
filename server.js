const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const passport = require('passport');
require('./config/passport');

const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ DB Error:', err));

// app.use('/api/auth', authRoutes);
app.use('/api/auth', require('./routes/authRoutes'));


app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
});
