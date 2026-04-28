const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { generateAccessToken, generateRefreshToken, setRefreshCookie, clearRefreshCookie } = require('../utils/jwt');
const { sendWelcome, sendPasswordReset } = require('../utils/email');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, phone } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already in use.' });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, phone: phone || null },
    select: { id: true, name: true, email: true, role: true },
  });

  sendWelcome(email, name).catch(console.error);

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  setRefreshCookie(res, refreshToken);
  res.status(201).json({ user, accessToken });
}));

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid credentials.' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  setRefreshCookie(res, refreshToken);
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
  });
}));

// POST /api/auth/refresh
router.post('/refresh', asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token.' });

  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
  });

  if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
    clearRefreshCookie(res);
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { token } });
  const newRefreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: stored.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  setRefreshCookie(res, newRefreshToken);
  const accessToken = generateAccessToken(stored.userId, stored.user.role);
  res.json({ accessToken, user: stored.user });
}));

// POST /api/auth/logout
router.post('/logout', asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } }).catch(() => {});
  }
  clearRefreshCookie(res);
  res.json({ message: 'Logged out.' });
}));

// POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond the same to prevent enumeration
  if (user && user.isActive) {
    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
    sendPasswordReset(email, user.name, otp).catch(console.error);
  }

  res.json({ message: 'If this email exists, an OTP has been sent.' });
}));

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
  body('password').isLength({ min: 8 }),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, otp, password } = req.body;
  const record = otpStore.get(email);

  if (!record || record.otp !== otp || record.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired OTP.' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await prisma.user.update({ where: { email }, data: { passwordHash } });
  otpStore.delete(email);

  // Invalidate all refresh tokens for this user
  await prisma.refreshToken.deleteMany({ where: { user: { email } } });

  res.json({ message: 'Password reset successful.' });
}));

// GET /api/auth/me
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, phone: true, profilePhoto: true, role: true, createdAt: true },
  });
  res.json(user);
}));

// PATCH /api/auth/me
router.patch('/me', authenticate, [
  body('name').optional().trim().notEmpty(),
  body('phone').optional().isMobilePhone(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, phone } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { ...(name && { name }), ...(phone && { phone }) },
    select: { id: true, name: true, email: true, phone: true, profilePhoto: true, role: true },
  });
  res.json(user);
}));

// PATCH /api/auth/change-password
router.patch('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(400).json({ error: 'Current password is incorrect.' });

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
  await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });

  clearRefreshCookie(res);
  res.json({ message: 'Password changed. Please log in again.' });
}));

// GET /api/auth/addresses
router.get('/addresses', authenticate, asyncHandler(async (req, res) => {
  const addresses = await prisma.address.findMany({ where: { userId: req.user.id } });
  res.json(addresses);
}));

// POST /api/auth/addresses
router.post('/addresses', authenticate, [
  body('name').trim().notEmpty(),
  body('phone').notEmpty(),
  body('line1').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('state').trim().notEmpty(),
  body('pincode').matches(/^\d{6}$/),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, phone, line1, line2, city, state, pincode, isDefault } = req.body;

  if (isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({
    data: { userId: req.user.id, name, phone, line1, line2: line2 || null, city, state, pincode, isDefault: !!isDefault },
  });
  res.status(201).json(address);
}));

// PUT /api/auth/addresses/:id
router.put('/addresses/:id', authenticate, asyncHandler(async (req, res) => {
  const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Address not found.' });

  const { name, phone, line1, line2, city, state, pincode, isDefault } = req.body;

  if (isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
  }

  const address = await prisma.address.update({
    where: { id: req.params.id },
    data: { name, phone, line1, line2, city, state, pincode, isDefault: !!isDefault },
  });
  res.json(address);
}));

// DELETE /api/auth/addresses/:id
router.delete('/addresses/:id', authenticate, asyncHandler(async (req, res) => {
  const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Address not found.' });
  await prisma.address.delete({ where: { id: req.params.id } });
  res.json({ message: 'Address deleted.' });
}));

module.exports = router;
