const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const { paginate, paginatedResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

// POST /api/coupons/validate
router.post('/validate', authenticate, asyncHandler(async (req, res) => {
  const { code, cartTotal, productIds, categories } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code required.' });

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
    include: { products: true, categories: true },
  });

  if (!coupon || !coupon.isActive) return res.status(400).json({ error: 'Invalid coupon.' });
  if (coupon.expiryDate && coupon.expiryDate < new Date()) return res.status(400).json({ error: 'Coupon has expired.' });
  if (coupon.startDate && coupon.startDate > new Date()) return res.status(400).json({ error: 'Coupon is not yet active.' });
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return res.status(400).json({ error: 'Coupon usage limit reached.' });

  const userUsages = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId: req.user.id } });
  if (userUsages >= coupon.perUserLimit) return res.status(400).json({ error: 'You have already used this coupon.' });

  if (coupon.type === 'FIRST_ORDER') {
    const orderCount = await prisma.order.count({ where: { userId: req.user.id } });
    if (orderCount > 0) return res.status(400).json({ error: 'This coupon is only for first orders.' });
  }

  if (coupon.minOrderValue && cartTotal < parseFloat(coupon.minOrderValue)) {
    return res.status(400).json({ error: `Minimum order value ₹${coupon.minOrderValue} required.` });
  }

  // Scope check
  if (coupon.scope === 'PRODUCTS') {
    const couponProductIds = coupon.products.map((p) => p.productId);
    const applicable = productIds?.some((id) => couponProductIds.includes(id));
    if (!applicable) return res.status(400).json({ error: 'Coupon not applicable to cart items.' });
  }
  if (coupon.scope === 'CATEGORIES') {
    const couponCats = coupon.categories.map((c) => c.category);
    const applicable = categories?.some((c) => couponCats.includes(c));
    if (!applicable) return res.status(400).json({ error: 'Coupon not applicable to cart categories.' });
  }

  let discountAmount = 0;
  if (coupon.type === 'PERCENTAGE' || coupon.type === 'FIRST_ORDER' || coupon.type === 'PRODUCT_SPECIFIC' || coupon.type === 'CATEGORY_SPECIFIC') {
    discountAmount = (cartTotal * parseFloat(coupon.value)) / 100;
  } else {
    discountAmount = parseFloat(coupon.value);
  }
  if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, parseFloat(coupon.maxDiscount));
  discountAmount = parseFloat(discountAmount.toFixed(2));

  res.json({ valid: true, coupon: { id: coupon.id, code: coupon.code, type: coupon.type, value: coupon.value }, discountAmount });
}));

// Admin CRUD
// GET /api/admin/coupons
router.get('/admin', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({ skip, take, orderBy: { createdAt: 'desc' }, include: { products: true, categories: true } }),
    prisma.coupon.count(),
  ]);
  res.json(paginatedResponse(coupons, total, page, limit));
}));

// POST /api/admin/coupons
router.post('/admin', authenticate, requireAdmin, [
  body('code').trim().notEmpty().toUpperCase(),
  body('type').isIn(['PERCENTAGE', 'FLAT', 'PRODUCT_SPECIFIC', 'CATEGORY_SPECIFIC', 'FIRST_ORDER']),
  body('value').isFloat({ min: 0 }),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { code, type, value, minOrderValue, maxDiscount, scope, usageLimit, perUserLimit,
    startDate, expiryDate, isActive, productIds, categories } = req.body;

  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      type,
      value: parseFloat(value),
      minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      scope: scope || 'ALL',
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      perUserLimit: parseInt(perUserLimit) || 1,
      startDate: startDate ? new Date(startDate) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isActive: isActive !== undefined ? !!isActive : true,
      products: productIds?.length ? { create: productIds.map((id) => ({ productId: id })) } : undefined,
      categories: categories?.length ? { create: categories.map((c) => ({ category: c })) } : undefined,
    },
  });

  await auditLog({ adminId: req.user.id, action: 'CREATE', entityType: 'Coupon', entityId: coupon.id, afterState: coupon, ipAddress: req.ip });
  res.status(201).json(coupon);
}));

// PUT /api/admin/coupons/:id
router.put('/admin/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const before = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Coupon not found.' });

  const { code, type, value, minOrderValue, maxDiscount, scope, usageLimit, perUserLimit,
    startDate, expiryDate, isActive } = req.body;

  const coupon = await prisma.coupon.update({
    where: { id: req.params.id },
    data: {
      ...(code && { code: code.toUpperCase() }),
      ...(type && { type }),
      ...(value !== undefined && { value: parseFloat(value) }),
      ...(minOrderValue !== undefined && { minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null }),
      ...(maxDiscount !== undefined && { maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null }),
      ...(scope && { scope }),
      ...(usageLimit !== undefined && { usageLimit: usageLimit ? parseInt(usageLimit) : null }),
      ...(perUserLimit !== undefined && { perUserLimit: parseInt(perUserLimit) }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
      ...(isActive !== undefined && { isActive: !!isActive }),
    },
  });

  await auditLog({ adminId: req.user.id, action: 'UPDATE', entityType: 'Coupon', entityId: coupon.id, beforeState: before, afterState: coupon, ipAddress: req.ip });
  res.json(coupon);
}));

// DELETE /api/admin/coupons/:id
router.delete('/admin/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });
  await prisma.coupon.delete({ where: { id: req.params.id } });
  await auditLog({ adminId: req.user.id, action: 'DELETE', entityType: 'Coupon', entityId: req.params.id, beforeState: coupon, ipAddress: req.ip });
  res.json({ message: 'Coupon deleted.' });
}));

// GET /api/admin/coupons/:id/stats
router.get('/admin/:id/stats', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });

  const usages = await prisma.couponUsage.findMany({
    where: { couponId: req.params.id },
    include: { order: { select: { totalAmount: true, discountAmount: true } } },
  });

  const totalRedemptions = usages.length;
  const totalDiscount = usages.reduce((s, u) => s + parseFloat(u.order.discountAmount), 0);
  const totalRevenue = usages.reduce((s, u) => s + parseFloat(u.order.totalAmount), 0);

  res.json({ coupon, totalRedemptions, totalDiscount, totalRevenue });
}));

module.exports = router;
