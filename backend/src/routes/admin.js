const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const { paginate, paginatedResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

// Admin dashboard KPIs
router.get('/dashboard', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [todayOrders, weekOrders, monthOrders, pendingOrders, openReturns, lowStockCount, pendingReviews] = await Promise.all([
    prisma.order.aggregate({ where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } }, _sum: { totalAmount: true }, _count: true }),
    prisma.order.aggregate({ where: { createdAt: { gte: weekAgo }, status: { not: 'CANCELLED' } }, _sum: { totalAmount: true }, _count: true }),
    prisma.order.aggregate({ where: { createdAt: { gte: monthAgo }, status: { not: 'CANCELLED' } }, _sum: { totalAmount: true }, _count: true }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.return.count({ where: { status: { in: ['REQUESTED', 'UNDER_REVIEW', 'APPROVED'] } } }),
    prisma.product.count({ where: { stock: { lte: 5 }, availability: 'PUBLISHED' } }),
    prisma.review.count({ where: { isApproved: false } }),
  ]);

  const recentOrders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  });

  res.json({
    revenue: {
      today: todayOrders._sum.totalAmount || 0,
      week: weekOrders._sum.totalAmount || 0,
      month: monthOrders._sum.totalAmount || 0,
    },
    orders: {
      today: todayOrders._count,
      week: weekOrders._count,
      month: monthOrders._count,
      pending: pendingOrders,
    },
    openReturns,
    lowStockCount,
    pendingReviews,
    recentOrders,
  });
}));

// User management
router.get('/users', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
  const where = req.query.role ? { role: req.query.role } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true, _count: { select: { orders: true } } },
    }),
    prisma.user.count({ where }),
  ]);
  res.json(paginatedResponse(users, total, page, limit));
}));

// Create salesperson / delivery agent
router.post('/users', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!['SALESPERSON', 'DELIVERY_AGENT'].includes(role)) return res.status(400).json({ error: 'Role must be SALESPERSON or DELIVERY_AGENT.' });
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required.' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already in use.' });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
    select: { id: true, name: true, email: true, role: true },
  });

  await auditLog({ adminId: req.user.id, action: 'CREATE', entityType: 'User', entityId: user.id, afterState: { ...user }, ipAddress: req.ip });
  res.status(201).json(user);
}));

// Activate / deactivate user
router.patch('/users/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const before = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'User not found.' });

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: !!isActive },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  await auditLog({ adminId: req.user.id, action: 'UPDATE', entityType: 'User', entityId: req.params.id, beforeState: { isActive: before.isActive }, afterState: { isActive: user.isActive }, ipAddress: req.ip });
  res.json(user);
}));

// Inventory management
router.get('/inventory', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { stock: 'asc' },
    select: { id: true, name: true, brand: true, category: true, stock: true, lowStockThreshold: true, availability: true },
  });
  res.json(products);
}));

// Bulk update stock via JSON array
router.post('/inventory/bulk-update', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { updates } = req.body; // [{ productId, stock }]
  if (!Array.isArray(updates)) return res.status(400).json({ error: 'updates array required.' });

  const results = [];
  for (const update of updates) {
    const before = await prisma.product.findUnique({ where: { id: update.productId }, select: { stock: true } });
    const product = await prisma.product.update({
      where: { id: update.productId },
      data: { stock: parseInt(update.stock) },
    });
    await auditLog({ adminId: req.user.id, action: 'STOCK_CHANGE', entityType: 'Product', entityId: update.productId, beforeState: before, afterState: { stock: product.stock }, ipAddress: req.ip });
    results.push({ productId: update.productId, stock: product.stock });
  }
  res.json({ updated: results.length, results });
}));

// Audit logs
router.get('/audit-logs', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
  const where = {};
  if (req.query.adminId) where.adminId = req.query.adminId;
  if (req.query.entityType) where.entityType = req.query.entityType;
  if (req.query.action) where.action = req.query.action;
  if (req.query.from || req.query.to) {
    where.createdAt = {};
    if (req.query.from) where.createdAt.gte = new Date(req.query.from);
    if (req.query.to) where.createdAt.lte = new Date(req.query.to);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' },
      include: { admin: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  res.json(paginatedResponse(logs, total, page, limit));
}));

module.exports = router;
