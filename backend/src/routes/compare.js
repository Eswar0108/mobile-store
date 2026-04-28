const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

const MAX_COMPARE = 3;

// GET /api/compare
router.get('/', asyncHandler(async (req, res) => {
  const sessionId = req.query.sessionId || req.cookies?.compareSession;
  if (!sessionId) return res.json([]);

  const items = await prisma.compareItem.findMany({
    where: { sessionId },
    include: {
      product: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          specs: true,
          colors: true,
          reviews: { where: { isApproved: true }, select: { rating: true } },
        },
      },
    },
    orderBy: { addedAt: 'asc' },
  });

  res.json(items.map((item) => ({
    ...item.product,
    primaryImage: item.product.images[0]?.url || null,
    avgRating: item.product.reviews.length
      ? (item.product.reviews.reduce((s, r) => s + r.rating, 0) / item.product.reviews.length).toFixed(1)
      : null,
  })));
}));

// POST /api/compare
router.post('/', asyncHandler(async (req, res) => {
  const { sessionId, productId } = req.body;
  if (!sessionId || !productId) return res.status(400).json({ error: 'sessionId and productId required.' });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.availability !== 'PUBLISHED') return res.status(404).json({ error: 'Product not found.' });

  const count = await prisma.compareItem.count({ where: { sessionId } });
  if (count >= MAX_COMPARE) return res.status(400).json({ error: `Maximum ${MAX_COMPARE} products can be compared.` });

  const item = await prisma.compareItem.upsert({
    where: { sessionId_productId: { sessionId, productId } },
    create: { sessionId, productId },
    update: {},
  });
  res.status(201).json(item);
}));

// DELETE /api/compare/:productId
router.delete('/:productId', asyncHandler(async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required.' });

  await prisma.compareItem.deleteMany({ where: { sessionId, productId: req.params.productId } });
  res.json({ message: 'Removed from comparison.' });
}));

// DELETE /api/compare (clear all)
router.delete('/', asyncHandler(async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required.' });
  await prisma.compareItem.deleteMany({ where: { sessionId } });
  res.json({ message: 'Comparison cleared.' });
}));

module.exports = router;
