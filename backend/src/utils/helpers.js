const slugify = require('slugify');
const prisma = require('../lib/prisma');

const generateSlug = async (name, existingId = null) => {
  let base = slugify(name, { lower: true, strict: true });
  let slug = base;
  let count = 1;

  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === existingId) break;
    slug = `${base}-${count++}`;
  }
  return slug;
};

const GST_RATE = 0.18;

const calculateOrderAmounts = (items, discountAmount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const gstAmount = parseFloat((afterDiscount * GST_RATE).toFixed(2));
  const totalAmount = parseFloat((afterDiscount + gstAmount).toFixed(2));
  return { subtotal: parseFloat(subtotal.toFixed(2)), discountAmount, gstAmount, totalAmount };
};

const paginate = (page, limit = 20) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, parseInt(limit) || 20);
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
};

const paginatedResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  },
});

module.exports = { generateSlug, calculateOrderAmounts, paginate, paginatedResponse, GST_RATE };
