// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String },
//   role: { type: String, enum: ['user', 'admin'], default: 'user' },
//   isVerified: { type: Boolean, default: false },
//   providers: { type: [String], default: ['local'] }, // 👈 updated
// }, { timestamps: true });


// module.exports = mongoose.model('User', userSchema);
const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true },
  type: { type: String, enum: ['verify', 'reset', 'auth'], required: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 } // Auto-delete after 1 hour

});

module.exports = mongoose.model('Token', tokenSchema);
