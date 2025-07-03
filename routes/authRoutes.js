const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  requestAccountDeletion,
  getAllDeleteRequests,
  approveDeleteRequest,
  rejectDeleteRequest,
  requestReset,
  resetPassword
} = require('../controllers/authController');

const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// ============ Local Auth ============
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.post('/request-delete', authenticateToken, requestAccountDeletion);

// ============ Email Verification ============
const Token = require('../models/Token');
const User = require('../models/User');

router.get('/verify-email/:token', async (req, res) => {
  try {
    const tokenDoc = await Token.findOne({ token: req.params.token, type: 'verify' });
    if (!tokenDoc) return res.status(400).send('Invalid or expired token');

    const user = await User.findById(tokenDoc.userId);
    if (!user) return res.status(400).send('User not found');

    user.isVerified = true;
    await user.save();
    await tokenDoc.deleteOne();

    res.redirect(`${process.env.CLIENT_URL}/login?verified=true`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ============ Password Reset ============
router.post('/request-reset', requestReset);
router.post('/reset-password/:token', resetPassword);

// ============ Social Login ============
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    const token = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET);
    await new Token({ userId: req.user._id, token, type: 'auth' }).save();
    res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
  }
);

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  async (req, res) => {
    const token = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET);
    await new Token({ userId: req.user._id, token, type: 'auth' }).save();
    res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
  }
);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/' }),
  async (req, res) => {
    const token = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    await new Token({ userId: req.user._id, token, type: 'auth' }).save();
    res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
  }
);

// ============ Admin ============
router.get('/delete-requests', authenticateToken, authorizeRoles('admin'), getAllDeleteRequests);
router.post('/delete-requests/:id/approve', authenticateToken, authorizeRoles('admin'), approveDeleteRequest);
router.delete('/delete-requests/:id/reject', authenticateToken, authorizeRoles('admin'), rejectDeleteRequest);

module.exports = router;
