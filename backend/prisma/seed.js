const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user
  const adminHash = await bcrypt.hash('Admin@12345', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mobilestore.in' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@mobilestore.in',
      passwordHash: adminHash,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('Admin created:', admin.email);

  // Salesperson
  const spHash = await bcrypt.hash('Sales@12345', 12);
  await prisma.user.upsert({
    where: { email: 'sales@mobilestore.in' },
    update: {},
    create: {
      name: 'Sales Manager',
      email: 'sales@mobilestore.in',
      passwordHash: spHash,
      role: 'SALESPERSON',
      isActive: true,
    },
  });

  // Sample products
  const products = [
    {
      name: 'Nova X Pro',
      brand: 'Nova',
      category: 'Flagship',
      description: 'The latest flagship smartphone with cutting-edge features.',
      price: 79999,
      discountPrice: 69999,
      stock: 50,
      availability: 'PUBLISHED',
      isFeatured: true,
      specs: [
        { key: 'Display', value: '6.7" AMOLED 120Hz' },
        { key: 'Camera', value: '200MP + 50MP + 12MP' },
        { key: 'Battery', value: '5000mAh' },
        { key: 'RAM', value: '12GB' },
        { key: 'Storage', value: '256GB' },
        { key: 'Processor', value: 'Snapdragon 8 Gen 3' },
        { key: 'OS', value: 'Android 14' },
      ],
      colors: ['Midnight Black', 'Arctic White', 'Ocean Blue'],
      tags: ['flagship', '5g', 'nova', 'best seller'],
    },
    {
      name: 'BudgetKing A5',
      brand: 'BudgetKing',
      category: 'Budget',
      description: 'Best budget phone under 15K with long battery life.',
      price: 14999,
      discountPrice: 12999,
      stock: 120,
      availability: 'PUBLISHED',
      isFeatured: false,
      specs: [
        { key: 'Display', value: '6.5" IPS LCD 90Hz' },
        { key: 'Camera', value: '50MP + 8MP' },
        { key: 'Battery', value: '6000mAh' },
        { key: 'RAM', value: '6GB' },
        { key: 'Storage', value: '128GB' },
        { key: 'Processor', value: 'MediaTek Helio G85' },
        { key: 'OS', value: 'Android 13' },
      ],
      colors: ['Forest Green', 'Sunset Orange'],
      tags: ['budget', 'long battery', 'value for money'],
    },
    {
      name: 'ProCam Ultra',
      brand: 'ProCam',
      category: 'Camera Phone',
      description: 'Revolutionary camera phone for photography enthusiasts.',
      price: 54999,
      discountPrice: 49999,
      stock: 30,
      availability: 'PUBLISHED',
      isFeatured: true,
      specs: [
        { key: 'Display', value: '6.8" LTPO AMOLED' },
        { key: 'Camera', value: '1-inch sensor, 50MP main' },
        { key: 'Battery', value: '4500mAh' },
        { key: 'RAM', value: '8GB' },
        { key: 'Storage', value: '256GB' },
        { key: 'Processor', value: 'Dimensity 9200+' },
        { key: 'OS', value: 'Android 14' },
      ],
      colors: ['Graphite', 'Silver'],
      tags: ['camera', 'photography', 'flagship'],
    },
  ];

  for (const p of products) {
    const slug = p.name.toLowerCase().replace(/\s+/g, '-');
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: p.name,
        slug,
        brand: p.brand,
        category: p.category,
        description: p.description,
        price: p.price,
        discountPrice: p.discountPrice,
        stock: p.stock,
        availability: p.availability,
        isFeatured: p.isFeatured,
        specs: { create: p.specs },
        colors: { create: p.colors.map((c) => ({ colorName: c })) },
        tags: { create: p.tags.map((t) => ({ tag: t })) },
      },
    });
    console.log('Product seeded:', p.name);
  }

  // Sample banner
  await prisma.banner.upsert({
    where: { id: 'seed-banner-1' },
    update: {},
    create: {
      id: 'seed-banner-1',
      title: 'Summer Sale — Up to 30% Off!',
      subtitle: 'On selected flagship phones',
      ctaText: 'Shop Now',
      ctaLink: '/products?onSale=true',
      isActive: true,
      displayOrder: 1,
    },
  });

  // Sample coupon
  await prisma.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: {
      code: 'WELCOME20',
      type: 'FIRST_ORDER',
      value: 20,
      maxDiscount: 2000,
      perUserLimit: 1,
      isActive: true,
    },
  });

  // Help articles
  const articles = [
    { title: 'How do I track my order?', body: 'Go to My Orders and click on any order to see the live tracking timeline.', category: 'Orders & Delivery', sortOrder: 1 },
    { title: 'What payment methods are accepted?', body: 'We accept UPI, credit/debit cards, net banking, wallets via Razorpay, and Cash on Delivery.', category: 'Payments & Refunds', sortOrder: 1 },
    { title: 'How do I return a product?', body: 'Go to My Orders, select the delivered item, and click "Request Return" within 7 days of delivery.', category: 'Returns', sortOrder: 1 },
    { title: 'How do I change my password?', body: 'Go to Profile > Change Password and enter your current and new password.', category: 'Account & Profile', sortOrder: 1 },
    { title: 'How do I compare products?', body: 'Click the "Add to Compare" button on any product card or detail page. You can compare up to 3 products.', category: 'Products', sortOrder: 1 },
  ];

  for (const a of articles) {
    const existing = await prisma.helpArticle.findFirst({ where: { title: a.title } });
    if (!existing) {
      await prisma.helpArticle.create({ data: { ...a, isPublished: true } });
      console.log('Help article seeded:', a.title);
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
