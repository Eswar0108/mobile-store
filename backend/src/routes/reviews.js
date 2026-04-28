const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const { paginate, paginatedResponse } = require('../utils/helpers');
const { sendNewReviewAlert } = require('../utils/email');
const { asyncHandler } = require('../middleware/errorHandler');

// POST /api/reviews
router.post('/', authenticate, [
  body('productId').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('title').optional().isLength({ max: 100 }),
  body('body').optional().isLength({ max: 1000 }),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { productId, rating, title, body: reviewBody } = req.body;

  // Verify purchase
  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId: req.user.id, status: 'DELIVERED' },
    },
  });
  if (!purchased) return res.status(403).json({ error: 'You can only review products you have purchased and received.' });

  const existing = await prisma.review.findUnique({ where: { productId_userId: { productId, userId: req.user.id } } });
  if (existing) return res.status(409).json({ error: 'You have already reviewed this product.' });

  const review = await prisma.review.create({
    data: { productId, userId: req.user.id, rating, title: title || null, body: reviewBody || null },
    include: { user: { select: { name: true } } },
  });

  // Notify admin
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
  const adminUsers = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { email: true } });
  adminUsers.forEach((a) => sendNewReviewAlert(a.email, product.name).catch(console.error));

  res.status(201).json(review);
}));

// GET /api/products/:id/reviews
router.get('/product/:productId', asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
  const sort = req.query.sort;
  const orderBy = sort === 'helpful' ? { helpfulCount: 'desc' } : sort === 'highest' ? { rating: 'desc' } : sort === 'lowest' ? { rating: 'asc' } : { createdAt: 'desc' };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId: req.params.productId, isApproved: true },
      skip, take, orderBy,
      include: { user: { select: { name: true } } },
    }),
    prisma.review.count({ where: { productId: req.params.productId, isApproved: true } }),
  ]);

  // Rating distribution
  const distribution = await prisma.review.groupBy({
    by: ['rating'],
    where: { productId: req.params.productId, isApproved: true },
    _count: { rating: true },
  });

  res.json({ ...paginatedResponse(reviews, total, page, limit), distribution });
}));

// POST /api/reviews/:id/helpful
router.post('/:id/helpful', authenticate, asyncHandler(async (req, res) => {
  const updated = await prisma.review.update({
    where: { id: req.params.id },
    data: { helpfulCount: { increment: 1 } },
  });
  res.json({ helpfulCount: updated.helpfulCount });
}));

// POST /api/reviews/:id/flag
router.post('/:id/flag', authenticate, asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ error: 'Reason required.' });

  await prisma.reviewFlag.upsert({
    where: { reviewId_userId: { reviewId: req.params.id, userId: req.user.id } },
    create: { reviewId: req.params.id, userId: req.user.id, reason },
    update: { reason },
  });
  res.json({ message: 'Review flagged.' });
}));

// Admin: GET pending reviews
router.get('/admin/pending', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { isApproved: false },
      skip, take, orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } }, product: { select: { name: true } } },
    }),
    prisma.review.count({ where: { isApproved: false } }),
  ]);
  res.json(paginatedResponse(reviews, total, page, limit));
}));

// Admin: GET flagged reviews
router.get('/admin/flagged', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { flags: { some: {} } },
    include: { user: { select: { name: true } }, product: { select: { name: true } }, flags: true },
  });
  res.json(reviews);
}));

// Admin: PATCH review (approve/reject)
router.patch('/admin/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { isApproved } = req.body;
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) return res.status(404).json({ error: 'Review not found.' });

  const updated = await prisma.review.update({ where: { id: req.params.id }, data: { isApproved: !!isApproved } });
  await auditLog({ adminId: req.user.id, action: isApproved ? 'APPROVE' : 'REJECT', entityType: 'Review', entityId: req.params.id, ipAddress: req.ip });
  res.json(updated);
}));

// Admin: DELETE review
router.delete('/admin/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) return res.status(404).json({ error: 'Review not found.' });
  await prisma.review.delete({ where: { id: req.params.id } });
  await auditLog({ adminId: req.user.id, action: 'DELETE', entityType: 'Review', entityId: req.params.id, ipAddress: req.ip });
  res.json({ message: 'Review deleted.' });
}));

module.exports = router;
