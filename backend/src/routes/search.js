const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { paginate, paginatedResponse } = require('../utils/helpers');

// GET /api/search?q=
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query;
  if (!q || q.trim().length < 2) return res.json({ data: [], suggestions: [] });

  const query = q.trim();
  const { skip, take, page: p, limit: l } = paginate(page, limit || 20);

  const products = await prisma.product.findMany({
    where: {
      availability: 'PUBLISHED',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { tags: { some: { tag: { contains: query, mode: 'insensitive' } } } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    skip,
    take,
    select: {
      id: true, name: true, slug: true, brand: true, category: true,
      price: true, discountPrice: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
  });

  const total = await prisma.product.count({
    where: {
      availability: 'PUBLISHED',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
      ],
    },
  });

  // Log the search
  await prisma.searchLog.create({
    data: {
      userId: req.user?.id || null,
      query,
      resultsCount: total,
    },
  }).catch(() => {});

  // Store in user recent searches (last 5)
  if (req.user) {
    // We store in searchLogs and derive recent from there
  }

  res.json(paginatedResponse(products.map((p) => ({
    ...p,
    primaryImage: p.images[0]?.url || null,
  })), total, p, l));
}));

// GET /api/search/popular
router.get('/popular', asyncHandler(async (req, res) => {
  const popular = await prisma.searchLog.groupBy({
    by: ['query'],
    _count: { query: true },
    orderBy: { _count: { query: 'desc' } },
    take: 10,
  });
  res.json(popular.map((p) => ({ query: p.query, count: p._count.query })));
}));

// GET /api/search/history (auth)
router.get('/history', optionalAuth, asyncHandler(async (req, res) => {
  if (!req.user) return res.json([]);
  const history = await prisma.searchLog.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    distinct: ['query'],
    select: { query: true, createdAt: true },
  });
  res.json(history);
}));

module.exports = router;
