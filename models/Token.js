// const mongoose = require('mongoose');

// const tokenSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
//   token: { type: String, required: true },
//   type: { type: String, enum: ['verify', 'reset', 'auth'], required: true },
//   createdAt: { type: Date, default: Date.now, expires: 3600 } // Auto-remove after 1 hour (for verify/reset)
// });

// module.exports = mongoose.model('Token', tokenSchema);
// const mongoose = require('mongoose');

// const tokenSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
//   token: { type: String, required: true },
//   type: { type: String, enum: ['verify', 'reset', 'auth'], required: true },
//   createdAt: { type: Date, default: Date.now, expires: 3600 } // Auto-delete after 1 hour

// });

// module.exports = mongoose.model('Token', tokenSchema);

const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true },
  type: { type: String, enum: ['verify', 'reset', 'auth'], required: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 } // Auto-delete after 1 hour
});

// ✅ Prevent OverwriteModelError during hot reloads or multiple imports
module.exports = mongoose.models.Token || mongoose.model('Token', tokenSchema);
