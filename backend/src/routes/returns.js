const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { uploadReturnImages } = require('../middleware/upload');
const { auditLog } = require('../middleware/audit');
const { notify } = require('../utils/notify');
const { sendReturnUpdate, sendRefundUpdate, sendNewReturnAlert } = require('../utils/email');
const { paginate, paginatedResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const RETURN_WINDOW_DAYS = parseInt(process.env.RETURN_WINDOW_DAYS) || 7;

// POST /api/returns
router.post('/', authenticate, (req, res, next) => {
  uploadReturnImages(req, res, async (err) => {
    if (err) return next(err);

    try {
      const { orderItemId, reason, description } = req.body;
      if (!orderItemId || !reason) return res.status(400).json({ error: 'orderItemId and reason required.' });

      // Verify order item belongs to user and is delivered
      const orderItem = await prisma.orderItem.findFirst({
        where: { id: orderItemId, order: { userId: req.user.id, status: 'DELIVERED' } },
        include: { order: true, product: true },
      });
      if (!orderItem) return res.status(404).json({ error: 'Order item not found or not eligible for return.' });

      // Check return window
      const deliveryHistory = await prisma.orderStatusHistory.findFirst({
        where: { orderId: orderItem.orderId, status: 'DELIVERED' },
        orderBy: { timestamp: 'desc' },
      });
      if (deliveryHistory) {
        const daysSince = (Date.now() - deliveryHistory.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > RETURN_WINDOW_DAYS) {
          return res.status(400).json({ error: `Return window of ${RETURN_WINDOW_DAYS} days has passed.` });
        }
      }

      // Check no existing return for this item
      const existingReturn = await prisma.return.findUnique({ where: { orderItemId } });
      if (existingReturn) return res.status(409).json({ error: 'A return request already exists for this item.' });

      const returnRequest = await prisma.return.create({
        data: {
          orderId: orderItem.orderId,
          orderItemId,
          userId: req.user.id,
          productId: orderItem.productId,
          reason,
          description: description || null,
          images: req.files?.length ? { create: req.files.map((f) => ({ url: f.path })) } : undefined,
        },
        include: { images: true },
      });

      // Notify admin
      const adminUsers = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { email: true } });
      adminUsers.forEach((a) => sendNewReturnAlert(a.email, returnRequest.id, orderItem.product.name).catch(console.error));

      res.status(201).json(returnRequest);
    } catch (e) {
      next(e);
    }
  });
});

// GET /api/returns (customer)
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
  const [returns, total] = await Promise.all([
    prisma.return.findMany({
      where: { userId: req.user.id },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { name: true, images: { where: { isPrimary: true }, take: 1 } } }, images: true },
    }),
    prisma.return.count({ where: { userId: req.user.id } }),
  ]);
  res.json(paginatedResponse(returns, total, page, limit));
}));

// GET /api/admin/returns
router.get('/admin', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
  const where = req.query.status ? { status: req.query.status } : {};
  const [returns, total] = await Promise.all([
    prisma.return.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true } },
        images: true,
      },
    }),
    prisma.return.count({ where }),
  ]);
  res.json(paginatedResponse(returns, total, page, limit));
}));

// PATCH /api/admin/returns/:id
router.patch('/admin/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const returnRequest = await prisma.return.findUnique({ where: { id: req.params.id } });
  if (!returnRequest) return res.status(404).json({ error: 'Return not found.' });

  const updated = await prisma.return.update({ where: { id: req.params.id }, data: { status } });

  const customer = await prisma.user.findUnique({ where: { id: returnRequest.userId } });
  sendReturnUpdate(customer.email, customer.name, returnRequest.id, status).catch(console.error);
  await notify(req.io, { userId: returnRequest.userId, message: `Return #${returnRequest.id} status: ${status}`, type: 'RETURN', link: `/orders` });

  await auditLog({ adminId: req.user.id, action: 'UPDATE', entityType: 'Return', entityId: req.params.id, beforeState: returnRequest, afterState: updated, ipAddress: req.ip });
  res.json(updated);
}));

// POST /api/admin/returns/:id/refund
router.post('/admin/:id/refund', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const returnRequest = await prisma.return.findUnique({
    where: { id: req.params.id },
    include: { order: true },
  });
  if (!returnRequest) return res.status(404).json({ error: 'Return not found.' });
  if (returnRequest.status !== 'ITEM_RECEIVED') return res.status(400).json({ error: 'Item must be received before refund.' });

  const { refundAmount } = req.body;
  const amount = refundAmount ? parseFloat(refundAmount) : parseFloat(returnRequest.order.totalAmount);

  let refundId = `MANUAL-${Date.now()}`;

  if (returnRequest.order.paymentMethod === 'RAZORPAY' && returnRequest.order.paymentId) {
    try {
      const refund = await razorpay.payments.refund(returnRequest.order.paymentId, {
        amount: Math.round(amount * 100),
        notes: { returnId: returnRequest.id },
      });
      refundId = refund.id;
    } catch (err) {
      return res.status(500).json({ error: 'Razorpay refund failed: ' + err.message });
    }
  }

  const updated = await prisma.return.update({
    where: { id: req.params.id },
    data: { status: 'REFUND_INITIATED', refundAmount: amount, refundId },
  });

  const customer = await prisma.user.findUnique({ where: { id: returnRequest.userId } });
  sendRefundUpdate(customer.email, customer.name, amount, 'Initiated').catch(console.error);
  await notify(req.io, { userId: returnRequest.userId, message: `Refund of ₹${amount} initiated for return #${returnRequest.id}`, type: 'REFUND', link: `/orders` });

  await auditLog({ adminId: req.user.id, action: 'REFUND_INITIATED', entityType: 'Return', entityId: req.params.id, afterState: { refundId, amount }, ipAddress: req.ip });
  res.json(updated);
}));

module.exports = router;
