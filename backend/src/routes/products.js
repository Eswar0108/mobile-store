const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { uploadProductImages } = require('../middleware/upload');
const { auditLog } = require('../middleware/audit');
const { generateSlug, paginate, paginatedResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

// Build product where clause from query params
const buildProductFilter = (q) => {
  const where = {};
  if (q.search) {
    where.OR = [
      { name: { contains: q.search, mode: 'insensitive' } },
      { brand: { contains: q.search, mode: 'insensitive' } },
      { category: { contains: q.search, mode: 'insensitive' } },
      { description: { contains: q.search, mode: 'insensitive' } },
    ];
  }
  if (q.category) where.category = { equals: q.category, mode: 'insensitive' };
  if (q.brand) where.brand = { equals: q.brand, mode: 'insensitive' };
  if (q.minPrice || q.maxPrice) {
    where.discountPrice = {};
    if (q.minPrice) where.discountPrice.gte = parseFloat(q.minPrice);
    if (q.maxPrice) where.discountPrice.lte = parseFloat(q.maxPrice);
  }
  if (q.onSale === 'true') where.discountPrice = { not: null };
  if (q.inStock === 'true') where.stock = { gt: 0 };
  // Public-facing: only published products
  if (!q.adminView) where.availability = 'PUBLISHED';
  return where;
};

const buildProductSort = (sort) => {
  switch (sort) {
    case 'price_asc': return { discountPrice: 'asc' };
    case 'price_desc': return { discountPrice: 'desc' };
    case 'newest': return { createdAt: 'desc' };
    case 'discount': return { discountPrice: 'asc' };
    default: return { createdAt: 'desc' };
  }
};

const productSelect = {
  id: true, name: true, slug: true, brand: true, category: true,
  price: true, discountPrice: true, stock: true, lowStockThreshold: true,
  availability: true, isFeatured: true,
  images: { where: { isPrimary: true }, take: 1 },
  reviews: { select: { rating: true }, where: { isApproved: true } },
};

// GET /api/products
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
  const where = buildProductFilter(req.query);
  const orderBy = buildProductSort(req.query.sort);

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip, take, select: productSelect }),
    prisma.product.count({ where }),
  ]);

  const enriched = products.map((p) => ({
    ...p,
    avgRating: p.reviews.length ? (p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length).toFixed(1) : null,
    reviewCount: p.reviews.length,
    primaryImage: p.images[0]?.url || null,
    savingPercent: p.discountPrice ? Math.round(((p.price - p.discountPrice) / p.price) * 100) : 0,
    isLowStock: p.stock > 0 && p.stock <= p.lowStockThreshold,
  }));

  res.json(paginatedResponse(enriched, total, page, limit));
}));

// GET /api/products/:slug
router.get('/:slug', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      specs: true,
      colors: true,
      tags: true,
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!product || (product.availability !== 'PUBLISHED')) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const avgRating = product.reviews.length
    ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  // Related products
  const related = await prisma.product.findMany({
    where: { category: product.category, id: { not: product.id }, availability: 'PUBLISHED' },
    take: 6,
    select: productSelect,
  });

  res.json({ ...product, avgRating, reviewCount: product.reviews.length, primaryImage: product.images[0]?.url || null, related });
}));

// POST /api/products (admin)
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { name, brand, category, description, price, discountPrice, stock, lowStockThreshold,
    availability, isFeatured, seoTitle, seoDescription, hsnCode, specs, colors, tags } = req.body;

  if (!name || !brand || !category || !price) {
    return res.status(400).json({ error: 'Name, brand, category and price are required.' });
  }

  const slug = await generateSlug(name);

  const product = await prisma.product.create({
    data: {
      name, slug, brand, category, description: description || '',
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : null,
      stock: parseInt(stock) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
      availability: availability || 'DRAFT',
      isFeatured: !!isFeatured,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      hsnCode: hsnCode || null,
      specs: specs ? { create: specs } : undefined,
      colors: colors ? { create: colors.map((c) => ({ colorName: c })) } : undefined,
      tags: tags ? { create: tags.map((t) => ({ tag: t })) } : undefined,
    },
    include: { specs: true, colors: true, tags: true, images: true },
  });

  await auditLog({ adminId: req.user.id, action: 'CREATE', entityType: 'Product', entityId: product.id, afterState: product, ipAddress: req.ip });
  res.status(201).json(product);
}));

// PUT /api/products/:id (admin)
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const before = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Product not found.' });

  const { name, brand, category, description, price, discountPrice, stock,
    lowStockThreshold, availability, isFeatured, seoTitle, seoDescription, hsnCode, specs, colors, tags } = req.body;

  const slug = name && name !== before.name ? await generateSlug(name, req.params.id) : before.slug;

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name, slug }),
      ...(brand && { brand }),
      ...(category && { category }),
      ...(description !== undefined && { description }),
      ...(price && { price: parseFloat(price) }),
      ...(discountPrice !== undefined && { discountPrice: discountPrice ? parseFloat(discountPrice) : null }),
      ...(stock !== undefined && { stock: parseInt(stock) }),
      ...(lowStockThreshold !== undefined && { lowStockThreshold: parseInt(lowStockThreshold) }),
      ...(availability && { availability }),
      ...(isFeatured !== undefined && { isFeatured: !!isFeatured }),
      ...(seoTitle !== undefined && { seoTitle }),
      ...(seoDescription !== undefined && { seoDescription }),
      ...(hsnCode !== undefined && { hsnCode }),
    },
  });

  // Replace specs/colors/tags if provided
  if (specs) {
    await prisma.productSpec.deleteMany({ where: { productId: product.id } });
    if (specs.length) await prisma.productSpec.createMany({ data: specs.map((s) => ({ ...s, productId: product.id })) });
  }
  if (colors) {
    await prisma.productColor.deleteMany({ where: { productId: product.id } });
    if (colors.length) await prisma.productColor.createMany({ data: colors.map((c) => ({ colorName: c, productId: product.id })) });
  }
  if (tags) {
    await prisma.productTag.deleteMany({ where: { productId: product.id } });
    if (tags.length) await prisma.productTag.createMany({ data: tags.map((t) => ({ tag: t, productId: product.id })) });
  }

  await auditLog({ adminId: req.user.id, action: 'UPDATE', entityType: 'Product', entityId: product.id, beforeState: before, afterState: product, ipAddress: req.ip });
  res.json(product);
}));

// DELETE /api/products/:id (admin)
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  await prisma.product.delete({ where: { id: req.params.id } });
  await auditLog({ adminId: req.user.id, action: 'DELETE', entityType: 'Product', entityId: req.params.id, beforeState: product, ipAddress: req.ip });
  res.json({ message: 'Product deleted.' });
}));

// POST /api/products/:id/images (admin)
router.post('/:id/images', authenticate, requireAdmin, (req, res, next) => {
  uploadProductImages(req, res, async (err) => {
    if (err) return next(err);
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No images uploaded.' });

    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const hasPrimary = await prisma.productImage.findFirst({ where: { productId: req.params.id, isPrimary: true } });

    const images = await Promise.all(req.files.map((file, idx) =>
      prisma.productImage.create({
        data: {
          productId: req.params.id,
          url: file.path,
          isPrimary: !hasPrimary && idx === 0,
          sortOrder: idx,
        },
      })
    ));
    res.status(201).json(images);
  });
});

// DELETE /api/products/:id/images/:imageId (admin)
router.delete('/:id/images/:imageId', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const image = await prisma.productImage.findFirst({ where: { id: req.params.imageId, productId: req.params.id } });
  if (!image) return res.status(404).json({ error: 'Image not found.' });
  await prisma.productImage.delete({ where: { id: req.params.imageId } });
  res.json({ message: 'Image deleted.' });
}));

// GET /api/products (admin view with drafts)
router.get('/admin/all', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
  const where = buildProductFilter({ ...req.query, adminView: true });
  const orderBy = buildProductSort(req.query.sort);

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip, take, select: productSelect }),
    prisma.product.count({ where }),
  ]);

  res.json(paginatedResponse(products, total, page, limit));
}));

// GET /api/products/admin/:id — single product for admin edit form
router.get('/admin/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { images: { orderBy: { sortOrder: 'asc' } }, specs: true, colors: true, tags: true },
  });
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json(product);
}));

module.exports = router;
