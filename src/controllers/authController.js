const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { models } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { sendEmail } = require('../utils/email');

const passwordResetTokens = new Map(); // token -> { userId, expiresAt }

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;

    const existing = await models.User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hashed = await hashPassword(password);
    const user = await models.User.create({ name, email, password: hashed, role: 'Attendee' });

    const token = signToken({ id: user.id, role: user.role });
    return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await models.User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await comparePassword(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = signToken({ id: user.id, role: user.role });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res) => {
  return res.json({ user: req.user });
};

const forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email } = req.body;
    const user = await models.User.findOne({ where: { email } });
    if (!user) return res.json({ message: 'If that email exists, a reset link was sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + (parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRES_MIN || '30', 10) * 60 * 1000);
    passwordResetTokens.set(token, { userId: user.id, expiresAt: expires });

    const resetUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
    await sendEmail({ to: email, subject: 'Password Reset', text: `Reset your password: ${resetUrl}` });

    return res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { token, password } = req.body;
    const entry = passwordResetTokens.get(token);
    if (!entry || Date.now() > entry.expiresAt) return res.status(400).json({ error: 'Invalid or expired token' });

    const hashed = await hashPassword(password);
    await models.User.update({ password: hashed }, { where: { id: entry.userId } });
    passwordResetTokens.delete(token);

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me, forgotPassword, resetPassword };
