const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/User');
const Token = require('../models/Token');
const sendEmail = require('../utils/sendEmail');

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

// ========== Logout ==========
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
