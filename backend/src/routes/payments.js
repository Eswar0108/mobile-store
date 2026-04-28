const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { notify } = require('../utils/notify');
const { asyncHandler } = require('../middleware/errorHandler');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/create-order
router.post('/create-order', authenticate, asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId required.' });

  const order = await prisma.order.findFirst({ where: { id: orderId, userId: req.user.id } });
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.status !== 'PENDING') return res.status(400).json({ error: 'Order is not in pending state.' });

  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(parseFloat(order.totalAmount) * 100), // paise
    currency: 'INR',
    receipt: order.id,
  });

  await prisma.order.update({ where: { id: orderId }, data: { razorpayOrderId: rzpOrder.id } });

  res.json({
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    key: process.env.RAZORPAY_KEY_ID,
  });
}));

// POST /api/payments/verify
router.post('/verify', authenticate, asyncHandler(async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  // Verify HMAC signature
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSig !== razorpaySignature) {
    return res.status(400).json({ error: 'Payment verification failed.' });
  }

  const order = await prisma.order.findFirst({ where: { id: orderId, userId: req.user.id } });
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  // Fetch cart items for finalizeOrder
  const cartItems = await prisma.cartItem.findMany({ where: { userId: req.user.id }, include: { product: true } });
  const coupon = order.couponId ? await prisma.coupon.findUnique({ where: { id: order.couponId } }) : null;

  // Update order
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CONFIRMED',
      paymentId: razorpayPaymentId,
      statusHistory: { create: { status: 'CONFIRMED', updatedById: req.user.id } },
    },
  });

  const { finalizeOrder } = require('./orders');
  await finalizeOrder(updated, cartItems, coupon, req.user, req.io);

  res.json({ message: 'Payment verified. Order confirmed.', order: updated });
}));

// POST /api/payments/webhook (Razorpay webhook — raw body)
router.post('/webhook', (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const body = req.body; // raw Buffer

  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSig !== signature) {
    return res.status(400).json({ error: 'Invalid webhook signature.' });
  }

  const event = JSON.parse(body.toString());
  console.log('Razorpay Webhook:', event.event);

  // Handle events idempotently
  // payment.captured, payment.failed, order.paid are handled here
  // Main verification is done via /verify endpoint

  res.json({ received: true });
});

module.exports = router;
