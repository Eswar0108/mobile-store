const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin, requireDeliveryAgent } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const { notify } = require('../utils/notify');
const { sendOrderConfirmation, sendOrderStatusUpdate } = require('../utils/email');
const { calculateOrderAmounts, paginate, paginatedResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');
const PDFDocument = require('pdfkit');

const VALID_STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED_DELIVERY'],
  DELIVERED: [],
  CANCELLED: [],
  FAILED_DELIVERY: ['OUT_FOR_DELIVERY'],
};

const AGENT_TRANSITIONS = ['OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY'];

// POST /api/orders
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { addressId, paymentMethod, couponCode } = req.body;
  if (!addressId || !paymentMethod) return res.status(400).json({ error: 'addressId and paymentMethod required.' });

  // Validate address belongs to user
  const address = await prisma.address.findFirst({ where: { id: addressId, userId: req.user.id } });
  if (!address) return res.status(404).json({ error: 'Address not found.' });

  // Get cart items
  const cartItems = await prisma.cartItem.findMany({
    where: { userId: req.user.id },
    include: { product: true },
  });
  if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty.' });

  // Validate stock
  for (const item of cartItems) {
    if (item.product.stock < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${item.product.name}.` });
    }
    if (item.product.availability !== 'PUBLISHED') {
      return res.status(400).json({ error: `${item.product.name} is no longer available.` });
    }
  }

  // Validate & apply coupon
  let coupon = null;
  let discountAmount = 0;

  if (couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
    if (!coupon || !coupon.isActive) return res.status(400).json({ error: 'Invalid or inactive coupon.' });
    if (coupon.expiryDate && coupon.expiryDate < new Date()) return res.status(400).json({ error: 'Coupon has expired.' });
    if (coupon.startDate && coupon.startDate > new Date()) return res.status(400).json({ error: 'Coupon is not yet active.' });
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return res.status(400).json({ error: 'Coupon usage limit reached.' });

    const userUsages = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId: req.user.id } });
    if (userUsages >= coupon.perUserLimit) return res.status(400).json({ error: 'You have already used this coupon.' });

    if (coupon.type === 'FIRST_ORDER') {
      const orderCount = await prisma.order.count({ where: { userId: req.user.id } });
      if (orderCount > 0) return res.status(400).json({ error: 'This coupon is only for first orders.' });
    }

    const subtotalRaw = cartItems.reduce((s, i) => s + parseFloat(i.product.discountPrice || i.product.price) * i.quantity, 0);
    if (coupon.minOrderValue && subtotalRaw < parseFloat(coupon.minOrderValue)) {
      return res.status(400).json({ error: `Minimum order value is ₹${coupon.minOrderValue}.` });
    }

    if (coupon.type === 'PERCENTAGE' || coupon.type === 'FIRST_ORDER') {
      discountAmount = (subtotalRaw * parseFloat(coupon.value)) / 100;
    } else {
      discountAmount = parseFloat(coupon.value);
    }
    if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, parseFloat(coupon.maxDiscount));
  }

  // Calculate totals using effective prices
  const itemsForCalc = cartItems.map((i) => ({
    price: parseFloat(i.product.discountPrice || i.product.price),
    quantity: i.quantity,
  }));
  const { subtotal, gstAmount, totalAmount } = calculateOrderAmounts(itemsForCalc, discountAmount);

  // Create order
  const order = await prisma.order.create({
    data: {
      userId: req.user.id,
      addressId,
      status: paymentMethod === 'COD' ? 'CONFIRMED' : 'PENDING',
      paymentMethod,
      couponId: coupon?.id || null,
      subtotal,
      discountAmount,
      gstAmount,
      totalAmount,
      items: {
        create: cartItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: parseFloat(i.product.discountPrice || i.product.price),
          colorVariant: i.colorVariant,
        })),
      },
      statusHistory: {
        create: { status: paymentMethod === 'COD' ? 'CONFIRMED' : 'PENDING', updatedById: req.user.id },
      },
    },
    include: { items: true },
  });

  // For COD: decrement stock, increment coupon usage, clear cart, notify
  if (paymentMethod === 'COD') {
    await finalizeOrder(order, cartItems, coupon, req.user, req.io);
  }

  res.status(201).json(order);
}));

// Helper to finalize order after payment
const finalizeOrder = async (order, cartItems, coupon, user, io) => {
  // Decrement stock
  for (const item of cartItems) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  // Increment coupon usage
  if (coupon) {
    await prisma.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } });
    await prisma.couponUsage.create({ data: { couponId: coupon.id, userId: user.id, orderId: order.id } });
  }

  // Clear cart
  await prisma.cartItem.deleteMany({ where: { userId: user.id } });

  // Email & notification
  sendOrderConfirmation(user.email, user.name, order.id).catch(console.error);
  if (io) {
    await notify(io, { userId: user.id, message: `Your order #${order.id} has been confirmed!`, type: 'ORDER', link: `/orders/${order.id}` });
  }
};

module.exports.finalizeOrder = finalizeOrder;

// GET /api/orders (customer)
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
  const where = { userId: req.user.id };
  if (req.query.status) where.status = req.query.status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  res.json(paginatedResponse(orders, total, page, limit));
}));

// GET /api/orders/:id
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const order = await prisma.order.findFirst({
    where: {
      id: req.params.id,
      ...(req.user.role !== 'ADMIN' && { userId: req.user.id }),
    },
    include: {
      items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } },
      address: true,
      coupon: true,
      statusHistory: { orderBy: { timestamp: 'asc' }, include: { updatedBy: { select: { name: true, role: true } } } },
    },
  });

  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json(order);
}));

// GET /api/orders/:id/invoice (PDF)
router.get('/:id/invoice', authenticate, asyncHandler(async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { items: { include: { product: true } }, address: true, coupon: true },
  });
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.status !== 'DELIVERED' && order.status !== 'SHIPPED') {
    return res.status(400).json({ error: 'Invoice only available for shipped or delivered orders.' });
  }

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.id}.pdf`);
  doc.pipe(res);

  doc.fontSize(20).text('MobileStore Invoice', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Order ID: ${order.id}`);
  doc.text(`Date: ${order.createdAt.toLocaleDateString('en-IN')}`);
  doc.text(`Status: ${order.status}`);
  doc.moveDown();
  doc.text(`Customer: ${order.address.name}`);
  doc.text(`Address: ${order.address.line1}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`);
  doc.moveDown();

  doc.text('Items:', { underline: true });
  order.items.forEach((item) => {
    doc.text(`${item.product.name} x${item.quantity} @ ₹${item.unitPrice} = ₹${(item.unitPrice * item.quantity).toFixed(2)}`);
  });

  doc.moveDown();
  doc.text(`Subtotal: ₹${order.subtotal}`);
  if (order.discountAmount > 0) doc.text(`Discount: -₹${order.discountAmount}`);
  doc.text(`GST (18%): ₹${order.gstAmount}`);
  doc.fontSize(14).text(`Total: ₹${order.totalAmount}`, { bold: true });

  doc.end();
}));

// PATCH /api/orders/:id/status
router.patch('/:id/status', authenticate, asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const isAdmin = req.user.role === 'ADMIN';
  const isAgent = req.user.role === 'DELIVERY_AGENT';

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  // Delivery agents: only update assigned order with allowed transitions
  if (isAgent) {
    if (!AGENT_TRANSITIONS.includes(status)) return res.status(403).json({ error: 'Not allowed.' });
    // Check if order is assigned to this agent (we'd store agentId on order in a real impl)
  }

  const allowed = VALID_STATUS_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Cannot transition from ${order.status} to ${status}.` });
  }

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      status,
      statusHistory: { create: { status, updatedById: req.user.id, note: note || null } },
    },
  });

  // Notify customer
  const customer = await prisma.user.findUnique({ where: { id: order.userId } });
  sendOrderStatusUpdate(customer.email, customer.name, order.id, status).catch(console.error);
  await notify(req.io, { userId: order.userId, message: `Your order #${order.id} is now ${status}`, type: 'ORDER', link: `/orders/${order.id}` });

  await auditLog({ adminId: req.user.id, action: 'STATUS_UPDATE', entityType: 'Order', entityId: order.id, beforeState: { status: order.status }, afterState: { status }, ipAddress: req.ip });
  res.json(updated);
}));

// Admin routes
// GET /api/admin/orders
router.get('/admin/all', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.paymentMethod) where.paymentMethod = req.query.paymentMethod;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    }),
    prisma.order.count({ where }),
  ]);
  res.json(paginatedResponse(orders, total, page, limit));
}));

// POST /api/admin/orders/:id/assign-agent
router.post('/admin/:id/assign-agent', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { agentId } = req.body;
  const agent = await prisma.user.findUnique({ where: { id: agentId } });
  if (!agent || agent.role !== 'DELIVERY_AGENT') return res.status(400).json({ error: 'Invalid delivery agent.' });

  // In a production system you'd have a deliveryAgentId column on orders
  // For now we log the assignment and note it
  await auditLog({ adminId: req.user.id, action: 'ASSIGN_AGENT', entityType: 'Order', entityId: req.params.id, afterState: { agentId }, ipAddress: req.ip });
  res.json({ message: 'Agent assigned.', agentId });
}));

// GET /api/admin/orders/export (CSV)
router.get('/admin/export', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = [
    'Order ID,Date,Customer,Email,Status,Payment,Subtotal,Discount,GST,Total',
    ...orders.map((o) =>
      `${o.id},${o.createdAt.toISOString()},${o.user.name},${o.user.email},${o.status},${o.paymentMethod},${o.subtotal},${o.discountAmount},${o.gstAmount},${o.totalAmount}`
    ),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
  res.send(rows);
}));

module.exports = router;
