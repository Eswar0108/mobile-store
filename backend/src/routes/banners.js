const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/banners (public — active only)
router.get('/', asyncHandler(async (req, res) => {
  const now = new Date();
  const banners = await prisma.banner.findMany({
    where: {
      isActive: true,
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
    orderBy: { displayOrder: 'asc' },
  });
  res.json(banners);
}));

// Admin CRUD
router.get('/admin', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const banners = await prisma.banner.findMany({ orderBy: { displayOrder: 'asc' } });
  res.json(banners);
}));

router.post('/admin', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { title, subtitle, ctaText, ctaLink, imageUrl, startDate, endDate, displayOrder, isActive } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required.' });

  const banner = await prisma.banner.create({
    data: {
      title, subtitle: subtitle || null, ctaText: ctaText || null, ctaLink: ctaLink || null,
      imageUrl: imageUrl || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      displayOrder: parseInt(displayOrder) || 0,
      isActive: isActive !== undefined ? !!isActive : true,
    },
  });

  await auditLog({ adminId: req.user.id, action: 'CREATE', entityType: 'Banner', entityId: banner.id, afterState: banner, ipAddress: req.ip });
  res.status(201).json(banner);
}));

router.put('/admin/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const before = await prisma.banner.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Banner not found.' });

  const { title, subtitle, ctaText, ctaLink, imageUrl, startDate, endDate, displayOrder, isActive } = req.body;
  const banner = await prisma.banner.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }),
      ...(subtitle !== undefined && { subtitle }),
      ...(ctaText !== undefined && { ctaText }),
      ...(ctaLink !== undefined && { ctaLink }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder) }),
      ...(isActive !== undefined && { isActive: !!isActive }),
    },
  });

  await auditLog({ adminId: req.user.id, action: 'UPDATE', entityType: 'Banner', entityId: banner.id, beforeState: before, afterState: banner, ipAddress: req.ip });
  res.json(banner);
}));

router.delete('/admin/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const banner = await prisma.banner.findUnique({ where: { id: req.params.id } });
  if (!banner) return res.status(404).json({ error: 'Banner not found.' });
  await prisma.banner.delete({ where: { id: req.params.id } });
  await auditLog({ adminId: req.user.id, action: 'DELETE', entityType: 'Banner', entityId: req.params.id, beforeState: banner, ipAddress: req.ip });
  res.json({ message: 'Banner deleted.' });
}));

module.exports = router;
