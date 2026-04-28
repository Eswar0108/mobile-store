const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/cart
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user.id },
    include: {
      product: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
  });
  res.json(items.map((i) => ({
    ...i,
    product: { ...i.product, primaryImage: i.product.images[0]?.url || null },
  })));
}));

// POST /api/cart
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { productId, quantity = 1, colorVariant } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId required.' });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.availability !== 'PUBLISHED') return res.status(404).json({ error: 'Product not found.' });
  if (product.stock <= 0) return res.status(400).json({ error: 'Product is out of stock.' });

  const cv = colorVariant || null;
  const existing = await prisma.cartItem.findFirst({ where: { userId: req.user.id, productId, colorVariant: cv } });
  const item = existing
    ? await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: { increment: parseInt(quantity) } } })
    : await prisma.cartItem.create({ data: { userId: req.user.id, productId, quantity: parseInt(quantity), colorVariant: cv } });
  res.status(201).json(item);
}));

// PUT /api/cart/:itemId
router.put('/:itemId', authenticate, asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Valid quantity required.' });

  const item = await prisma.cartItem.findFirst({ where: { id: req.params.itemId, userId: req.user.id } });
  if (!item) return res.status(404).json({ error: 'Cart item not found.' });

  const updated = await prisma.cartItem.update({ where: { id: req.params.itemId }, data: { quantity } });
  res.json(updated);
}));

// DELETE /api/cart/:itemId
router.delete('/:itemId', authenticate, asyncHandler(async (req, res) => {
  const item = await prisma.cartItem.findFirst({ where: { id: req.params.itemId, userId: req.user.id } });
  if (!item) return res.status(404).json({ error: 'Cart item not found.' });
  await prisma.cartItem.delete({ where: { id: req.params.itemId } });
  res.json({ message: 'Item removed.' });
}));

// POST /api/cart/merge — merge guest cart on login
router.post('/merge', authenticate, asyncHandler(async (req, res) => {
  const { items } = req.body; // [{ productId, quantity, colorVariant }]
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required.' });

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product || product.availability !== 'PUBLISHED') continue;

    const cv = item.colorVariant || null;
    const existing = await prisma.cartItem.findFirst({ where: { userId: req.user.id, productId: item.productId, colorVariant: cv } });
    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: { increment: item.quantity || 1 } } });
    } else {
      await prisma.cartItem.create({ data: { userId: req.user.id, productId: item.productId, quantity: item.quantity || 1, colorVariant: cv } });
    }
  }

  const cart = await prisma.cartItem.findMany({
    where: { userId: req.user.id },
    include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
  });
  res.json(cart);
}));

module.exports = router;
