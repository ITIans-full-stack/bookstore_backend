const mongoose = require('mongoose');

const deleteRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  reason: { type: String, required: false },
  requestedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DeleteRequest', deleteRequestSchema);
