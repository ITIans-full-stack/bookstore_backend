const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  providers: { type: [String], default: ['local'] }, // 👈 updated
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);
