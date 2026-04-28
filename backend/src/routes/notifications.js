const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/notifications
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
  res.json({ notifications, unreadCount });
}));

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
  res.json({ message: 'All notifications marked as read.' });
}));

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, asyncHandler(async (req, res) => {
  const notif = await prisma.notification.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!notif) return res.status(404).json({ error: 'Notification not found.' });
  const updated = await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  res.json(updated);
}));

module.exports = router;
