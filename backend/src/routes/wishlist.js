const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/wishlist
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user.id },
    include: {
      product: {
        include: { images: { where: { isPrimary: true }, take: 1 } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(items.map((i) => ({
    ...i,
    product: { ...i.product, primaryImage: i.product.images[0]?.url || null },
  })));
}));

// POST /api/wishlist
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId required.' });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.availability !== 'PUBLISHED') return res.status(404).json({ error: 'Product not found.' });

  const item = await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: req.user.id, productId } },
    create: { userId: req.user.id, productId },
    update: {},
  });
  res.status(201).json(item);
}));

// DELETE /api/wishlist/:productId
router.delete('/:productId', authenticate, asyncHandler(async (req, res) => {
  await prisma.wishlistItem.deleteMany({ where: { userId: req.user.id, productId: req.params.productId } });
  res.json({ message: 'Removed from wishlist.' });
}));

module.exports = router;
