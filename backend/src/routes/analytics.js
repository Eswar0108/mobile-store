const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, requireSalesperson } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const dateFilter = (req) => {
  const { from, to } = req.query;
  const gte = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const lte = to ? new Date(to) : new Date();
  return { gte, lte };
};

// GET /api/analytics/revenue
router.get('/revenue', authenticate, requireSalesperson, asyncHandler(async (req, res) => {
  const { gte, lte } = dateFilter(req);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte, lte }, status: { not: 'CANCELLED' } },
    select: { totalAmount: true, createdAt: true, status: true },
  });

  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.totalAmount), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

  // Daily revenue array
  const dailyMap = orders.reduce((acc, o) => {
    const date = o.createdAt.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + parseFloat(o.totalAmount);
    return acc;
  }, {});
  const data = Object.entries(dailyMap)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({ summary: { totalRevenue, totalOrders, avgOrderValue }, data });
}));

// GET /api/analytics/top-products
router.get('/top-products', authenticate, requireSalesperson, asyncHandler(async (req, res) => {
  const { gte, lte } = dateFilter(req);

  const items = await prisma.orderItem.findMany({
    where: { order: { createdAt: { gte, lte }, status: { not: 'CANCELLED' } } },
    include: { product: { select: { name: true, brand: true, stock: true, images: { where: { isPrimary: true }, take: 1 } } } },
  });

  const aggregated = items.reduce((acc, item) => {
    if (!acc[item.productId]) {
      acc[item.productId] = { productId: item.productId, product: item.product, units: 0, revenue: 0 };
    }
    acc[item.productId].units += item.quantity;
    acc[item.productId].revenue += item.quantity * parseFloat(item.unitPrice);
    return acc;
  }, {});

  const sorted = Object.values(aggregated).sort((a, b) => b.units - a.units).slice(0, 10);
  const products = sorted.map((p) => ({ name: p.product?.name || 'Unknown', revenue: p.revenue, units: p.units }));
  res.json({ products });
}));

// GET /api/analytics/orders (conversion funnel data)
router.get('/orders', authenticate, requireSalesperson, asyncHandler(async (req, res) => {
  const { gte, lte } = dateFilter(req);

  const statusCounts = await prisma.order.groupBy({
    by: ['status'],
    where: { createdAt: { gte, lte } },
    _count: { status: true },
  });

  const cartItems = await prisma.cartItem.count();
  const wishlistItems = await prisma.wishlistItem.count();

  const byStatus = statusCounts.map((s) => ({ status: s.status, count: s._count.status }));
  res.json({ byStatus, cartItems, wishlistItems });
}));

// GET /api/analytics/customers
router.get('/customers', authenticate, requireSalesperson, asyncHandler(async (req, res) => {
  const { gte, lte } = dateFilter(req);

  const newCustomers = await prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte, lte } } });
  const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });

  const newCustomerRows = await prisma.user.findMany({
    where: { role: 'CUSTOMER', createdAt: { gte, lte } },
    select: { createdAt: true },
  });
  const dailyMap = newCustomerRows.reduce((acc, u) => {
    const date = u.createdAt.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(dailyMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const byState = await prisma.address.groupBy({
    by: ['state'],
    _count: { state: true },
    orderBy: { _count: { state: 'desc' } },
    take: 10,
  });

  const topCities = await prisma.address.groupBy({
    by: ['city'],
    _count: { city: true },
    orderBy: { _count: { city: 'desc' } },
    take: 10,
  });

  res.json({ summary: { newCustomers, totalCustomers }, data, byState, topCities });
}));

// GET /api/analytics/categories
router.get('/categories', authenticate, requireSalesperson, asyncHandler(async (req, res) => {
  const { gte, lte } = dateFilter(req);

  const items = await prisma.orderItem.findMany({
    where: { order: { createdAt: { gte, lte }, status: { not: 'CANCELLED' } } },
    select: { quantity: true, unitPrice: true, product: { select: { category: true } } },
  });

  const map = {};
  for (const item of items) {
    const cat = item.product?.category || 'Other';
    map[cat] = (map[cat] || 0) + Number(item.unitPrice) * item.quantity;
  }

  const data = Object.entries(map)
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  res.json({ data });
}));

// GET /api/analytics/inventory
router.get('/inventory', authenticate, requireSalesperson, asyncHandler(async (req, res) => {
  const lowStock = await prisma.product.findMany({
    where: { stock: { lte: prisma.product.fields.lowStockThreshold }, availability: 'PUBLISHED' },
    select: { id: true, name: true, brand: true, stock: true, lowStockThreshold: true },
  });

  const outOfStock = await prisma.product.findMany({
    where: { stock: 0 },
    select: { id: true, name: true, brand: true, stock: true },
  });

  // Estimate days remaining based on recent sales velocity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentSales = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: { order: { createdAt: { gte: thirtyDaysAgo }, status: { not: 'CANCELLED' } } },
    _sum: { quantity: true },
  });

  const salesMap = recentSales.reduce((acc, s) => {
    acc[s.productId] = s._sum.quantity || 0;
    return acc;
  }, {});

  const products = await prisma.product.findMany({
    where: { availability: 'PUBLISHED' },
    select: { id: true, name: true, stock: true, lowStockThreshold: true },
  });

  const withDaysRemaining = products.map((p) => {
    const dailyRate = (salesMap[p.id] || 0) / 30;
    const daysRemaining = dailyRate > 0 ? Math.floor(p.stock / dailyRate) : null;
    return { ...p, daysRemaining };
  });

  res.json({ lowStock, outOfStock, inventory: withDaysRemaining });
}));

// GET /api/analytics/cart-wishlist
router.get('/cart-wishlist', authenticate, requireSalesperson, asyncHandler(async (req, res) => {
  const mostWishlisted = await prisma.wishlistItem.groupBy({
    by: ['productId'],
    _count: { productId: true },
    orderBy: { _count: { productId: 'desc' } },
    take: 10,
  });

  const mostInCart = await prisma.cartItem.groupBy({
    by: ['productId'],
    _count: { productId: true },
    orderBy: { _count: { productId: 'desc' } },
    take: 10,
  });

  const avgCartValue = await prisma.cartItem.aggregate({
    _avg: { quantity: true },
  });

  res.json({ mostWishlisted, mostInCart, avgCartQuantity: avgCartValue._avg.quantity });
}));

// GET /api/analytics/coupons
router.get('/coupons', authenticate, requireSalesperson, asyncHandler(async (req, res) => {
  const { gte, lte } = dateFilter(req);

  const usages = await prisma.couponUsage.findMany({
    where: { usedAt: { gte, lte } },
    include: {
      coupon: { select: { code: true, type: true } },
      order: { select: { discountAmount: true, totalAmount: true } },
    },
  });

  const byCoupon = usages.reduce((acc, u) => {
    const code = u.coupon.code;
    if (!acc[code]) acc[code] = { code, type: u.coupon.type, redemptions: 0, totalDiscount: 0, totalRevenue: 0 };
    acc[code].redemptions++;
    acc[code].totalDiscount += parseFloat(u.order.discountAmount);
    acc[code].totalRevenue += parseFloat(u.order.totalAmount);
    return acc;
  }, {});

  res.json({ usages: Object.values(byCoupon).sort((a, b) => b.redemptions - a.redemptions) });
}));

// GET /api/analytics/returns
router.get('/returns', authenticate, requireSalesperson, asyncHandler(async (req, res) => {
  const { gte, lte } = dateFilter(req);

  const returns = await prisma.return.findMany({
    where: { createdAt: { gte, lte } },
    include: { product: { select: { name: true } } },
  });

  const byProduct = returns.reduce((acc, r) => {
    const name = r.product.name;
    if (!acc[name]) acc[name] = { name, count: 0, reasons: {} };
    acc[name].count++;
    acc[name].reasons[r.reason] = (acc[name].reasons[r.reason] || 0) + 1;
    return acc;
  }, {});

  const refundTotal = returns.reduce((s, r) => s + (parseFloat(r.refundAmount) || 0), 0);

  const byReason = returns.reduce((acc, r) => {
    acc[r.reason] = (acc[r.reason] || 0) + 1;
    return acc;
  }, {});

  res.json({ total: returns.length, refundTotal, byProduct: Object.values(byProduct).sort((a, b) => b.count - a.count), byReason });
}));

// GET /api/analytics/search
router.get('/search', authenticate, requireSalesperson, asyncHandler(async (req, res) => {
  const topSearches = await prisma.searchLog.groupBy({
    by: ['query'],
    _count: { query: true },
    orderBy: { _count: { query: 'desc' } },
    take: 20,
  });

  const noResults = await prisma.searchLog.findMany({
    where: { resultsCount: 0 },
    orderBy: { createdAt: 'desc' },
    take: 20,
    distinct: ['query'],
    select: { query: true, createdAt: true },
  });

  res.json({ topSearches: topSearches.map((s) => ({ query: s.query, count: s._count.query })), noResults });
}));

// GET /api/analytics/compare
router.get('/compare', authenticate, requireSalesperson, asyncHandler(async (req, res) => {
  const mostCompared = await prisma.compareItem.groupBy({
    by: ['productId'],
    _count: { productId: true },
    orderBy: { _count: { productId: 'desc' } },
    take: 10,
  });

  res.json({ mostCompared: mostCompared.map((c) => ({ productId: c.productId, count: c._count.productId })) });
}));

module.exports = router;
