const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/help (published articles)
router.get('/', asyncHandler(async (req, res) => {
  const { search, category } = req.query;
  const where = { isPublished: true };
  if (category) where.category = category;
  if (search) where.title = { contains: search, mode: 'insensitive' };

  const articles = await prisma.helpArticle.findMany({ where, orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] });

  // Group by category
  const grouped = articles.reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});

  res.json({ articles, grouped });
}));

// GET /api/help/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const article = await prisma.helpArticle.findUnique({ where: { id: req.params.id } });
  if (!article || !article.isPublished) return res.status(404).json({ error: 'Article not found.' });
  res.json(article);
}));

// POST /api/help/:id/feedback
router.post('/:id/feedback', asyncHandler(async (req, res) => {
  const { helpful } = req.body;
  if (helpful === undefined) return res.status(400).json({ error: 'helpful (boolean) required.' });

  const updated = await prisma.helpArticle.update({
    where: { id: req.params.id },
    data: helpful ? { helpfulYes: { increment: 1 } } : { helpfulNo: { increment: 1 } },
  });
  res.json({ helpfulYes: updated.helpfulYes, helpfulNo: updated.helpfulNo });
}));

// Admin CRUD
router.get('/admin/all', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const articles = await prisma.helpArticle.findMany({ orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] });
  res.json(articles);
}));

router.post('/admin', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { title, body, category, isPublished, sortOrder } = req.body;
  if (!title || !body || !category) return res.status(400).json({ error: 'title, body, category required.' });

  const article = await prisma.helpArticle.create({
    data: { title, body, category, isPublished: !!isPublished, sortOrder: parseInt(sortOrder) || 0 },
  });

  await auditLog({ adminId: req.user.id, action: 'CREATE', entityType: 'HelpArticle', entityId: article.id, afterState: article, ipAddress: req.ip });
  res.status(201).json(article);
}));

router.put('/admin/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const before = await prisma.helpArticle.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Article not found.' });

  const { title, body, category, isPublished, sortOrder } = req.body;
  const article = await prisma.helpArticle.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }),
      ...(body && { body }),
      ...(category && { category }),
      ...(isPublished !== undefined && { isPublished: !!isPublished }),
      ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
    },
  });

  await auditLog({ adminId: req.user.id, action: 'UPDATE', entityType: 'HelpArticle', entityId: article.id, beforeState: before, afterState: article, ipAddress: req.ip });
  res.json(article);
}));

router.delete('/admin/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const article = await prisma.helpArticle.findUnique({ where: { id: req.params.id } });
  if (!article) return res.status(404).json({ error: 'Article not found.' });
  await prisma.helpArticle.delete({ where: { id: req.params.id } });
  await auditLog({ adminId: req.user.id, action: 'DELETE', entityType: 'HelpArticle', entityId: req.params.id, beforeState: article, ipAddress: req.ip });
  res.json({ message: 'Article deleted.' });
}));

module.exports = router;
