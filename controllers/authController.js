const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/User');
const Token = require('../models/Token');
const sendEmail = require('../utils/sendEmail');
const DeleteRequest = require('../models/DeleteRequest');


// ========== Register ==========
exports.register = async (req, res) => {
  try {
    console.log('📥 Incoming register payload:', req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    const token = crypto.randomBytes(32).toString('hex');
    const savedToken = await new Token({
      userId: user._id,
      token,
      type: 'verify',
    }).save();

    console.log('🧪 Token saved in DB:', savedToken);

    const link = `${process.env.API_URL}/api/auth/verify-email/${token}`;
    try {
      await sendEmail(user.email, 'Verify your email', `Click to verify: ${link}`);
      console.log('✅ Email sent to:', user.email);
    } catch (emailErr) {
      console.error('❌ Email send failed:', emailErr);
    }

    res.status(201).json({ message: 'Registered. Check email to verify.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ========== Login ==========
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first.' });

    const jwtToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    await new Token({
      userId: user._id,
      token: jwtToken,
      type: 'auth',
    }).save();

    res.json({ token: jwtToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//should send any api 
// ========== Logout ==========
//
exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token missing' });

    const deleted = await Token.findOneAndDelete({ token, type: 'auth' });
    if (!deleted) return res.status(404).json({ message: 'Token not found in DB' });

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ========== Profile ==========
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ========== Update Profile ==========
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // from authenticateToken middleware
    const { name, email, password } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ========== Request Account Deletion ==========
exports.requestAccountDeletion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason } = req.body;

    const existingRequest = await DeleteRequest.findOne({ userId });
    if (existingRequest) return res.status(400).json({ message: 'You already submitted a delete request.' });

    const request = await DeleteRequest.create({ userId, reason });
    res.status(201).json({ message: 'Delete request submitted', request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ========== Admin: View All Delete Requests ==========
exports.getAllDeleteRequests = async (req, res) => {
  try {
    const requests = await DeleteRequest.find().populate('userId', 'name email');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ========== Admin: Approve Delete Request ==========
exports.approveDeleteRequest = async (req, res) => {
  try {
    const request = await DeleteRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Delete request not found' });

    await User.findByIdAndDelete(request.userId);
    await request.deleteOne();

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ========== Admin: Reject Delete Request ==========
exports.rejectDeleteRequest = async (req, res) => {
  try {
    const request = await DeleteRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    await request.deleteOne();
    res.json({ message: 'Delete request rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};


//=============================resert 
exports.requestReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    // Delete existing reset tokens (optional cleanup)
    await Token.deleteMany({ userId: user._id, type: 'reset' });

    const token = crypto.randomBytes(32).toString('hex');
    await new Token({
      userId: user._id,
      token,
      type: 'reset',
    }).save();

    const link = `${process.env.CLIENT_URL}/reset-password/${token}`;
    await sendEmail(user.email, 'Reset Your Password', `Click to reset: ${link}`);

    res.json({ message: 'Reset link sent' });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const savedToken = await Token.findOne({ token, type: 'reset' });
    if (!savedToken) return res.status(400).json({ message: 'Invalid or expired token' });

    const hashed = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(savedToken.userId, { password: hashed });

    // Remove used token
    await Token.deleteOne({ _id: savedToken._id });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('❌ Password reset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
