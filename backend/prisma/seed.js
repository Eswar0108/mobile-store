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
    {
      name: 'GameBeast Pro',
      brand: 'GameBeast',
      category: 'Gaming',
      description: 'Dominate every game with 165Hz display, shoulder triggers, and massive cooling system.',
      price: 49999,
      discountPrice: 44999,
      stock: 40,
      availability: 'PUBLISHED',
      isFeatured: true,
      specs: [
        { key: 'Display', value: '6.78" AMOLED 165Hz' },
        { key: 'Camera', value: '64MP + 13MP' },
        { key: 'Battery', value: '6000mAh + 65W Fast Charge' },
        { key: 'RAM', value: '16GB' },
        { key: 'Storage', value: '256GB UFS 3.1' },
        { key: 'Processor', value: 'Snapdragon 8 Gen 2' },
        { key: 'OS', value: 'Android 14' },
        { key: 'Cooling', value: 'Vapor Chamber + Graphite' },
      ],
      colors: ['Cyber Black', 'Phantom Red'],
      tags: ['gaming', '5g', 'high refresh rate', 'best seller'],
    },
    {
      name: 'SpeedX 5G',
      brand: 'SpeedX',
      category: '5G',
      description: 'Affordable 5G connectivity with flagship-grade performance for everyday use.',
      price: 24999,
      discountPrice: 21999,
      stock: 80,
      availability: 'PUBLISHED',
      isFeatured: false,
      specs: [
        { key: 'Display', value: '6.6" FHD+ AMOLED 90Hz' },
        { key: 'Camera', value: '108MP + 8MP + 5MP' },
        { key: 'Battery', value: '5000mAh + 33W Fast Charge' },
        { key: 'RAM', value: '8GB' },
        { key: 'Storage', value: '128GB' },
        { key: 'Processor', value: 'Dimensity 810' },
        { key: 'OS', value: 'Android 13' },
        { key: '5G Bands', value: 'Sub-6GHz' },
      ],
      colors: ['Sapphire Blue', 'Glacier White', 'Jet Black'],
      tags: ['5g', 'value for money', 'mid-range'],
    },
    {
      name: 'Titan S23',
      brand: 'Titan',
      category: 'Flagship',
      description: 'Premium flagship with titanium frame, satellite connectivity and 7 years of OS updates.',
      price: 99999,
      discountPrice: 89999,
      stock: 25,
      availability: 'PUBLISHED',
      isFeatured: true,
      specs: [
        { key: 'Display', value: '6.9" Dynamic LTPO3 AMOLED 120Hz' },
        { key: 'Camera', value: '200MP + 50MP + 12MP + 10MP' },
        { key: 'Battery', value: '5500mAh + 100W Fast Charge' },
        { key: 'RAM', value: '16GB' },
        { key: 'Storage', value: '512GB UFS 4.0' },
        { key: 'Processor', value: 'Snapdragon 8 Elite' },
        { key: 'OS', value: 'Android 15' },
        { key: 'Build', value: 'Titanium Frame + Corning Gorilla Glass Victus 3' },
      ],
      colors: ['Titanium Silver', 'Midnight Black', 'Desert Gold'],
      tags: ['flagship', '5g', 'titan', 'premium'],
    },
    {
      name: 'SwiftCam Z1',
      brand: 'SwiftCam',
      category: 'Camera Phone',
      description: 'AI-powered zoom and night photography — carry a DSLR in your pocket.',
      price: 39999,
      discountPrice: 34999,
      stock: 35,
      availability: 'PUBLISHED',
      isFeatured: false,
      specs: [
        { key: 'Display', value: '6.7" OLED 120Hz' },
        { key: 'Camera', value: '50MP OIS + 50MP Periscope 10x + 12MP Ultrawide' },
        { key: 'Battery', value: '4700mAh' },
        { key: 'RAM', value: '12GB' },
        { key: 'Storage', value: '256GB' },
        { key: 'Processor', value: 'Dimensity 9000' },
        { key: 'OS', value: 'Android 14' },
        { key: 'Zoom', value: '10x Optical + 100x Space Zoom' },
      ],
      colors: ['Pearl White', 'Cosmic Black'],
      tags: ['camera', '5g', 'zoom', 'photography'],
    },
    {
      name: 'ValuePlus V10',
      brand: 'ValuePlus',
      category: 'Budget',
      description: 'Feature-packed budget phone with 90Hz display and 5000mAh battery under 10K.',
      price: 9999,
      discountPrice: 8499,
      stock: 200,
      availability: 'PUBLISHED',
      isFeatured: false,
      specs: [
        { key: 'Display', value: '6.52" HD+ IPS LCD 90Hz' },
        { key: 'Camera', value: '48MP + 2MP' },
        { key: 'Battery', value: '5000mAh + 18W Fast Charge' },
        { key: 'RAM', value: '4GB' },
        { key: 'Storage', value: '64GB (expandable)' },
        { key: 'Processor', value: 'Unisoc T616' },
        { key: 'OS', value: 'Android 13 Go' },
      ],
      colors: ['Sky Blue', 'Mint Green', 'Charcoal'],
      tags: ['budget', 'long battery', 'value for money'],
    },
    {
      name: 'ArenaX Gaming Edition',
      brand: 'ArenaX',
      category: 'Gaming',
      description: 'Built for mobile esports — active cooling fan, 144Hz display, and 120W charging.',
      price: 34999,
      discountPrice: 29999,
      stock: 45,
      availability: 'PUBLISHED',
      isFeatured: false,
      specs: [
        { key: 'Display', value: '6.67" AMOLED 144Hz 1ms response' },
        { key: 'Camera', value: '50MP + 8MP' },
        { key: 'Battery', value: '5500mAh + 120W HyperCharge' },
        { key: 'RAM', value: '12GB' },
        { key: 'Storage', value: '256GB' },
        { key: 'Processor', value: 'Snapdragon 7 Gen 3' },
        { key: 'OS', value: 'Android 14' },
        { key: 'Cooling', value: 'Active Cooling Fan + ICE Loop' },
      ],
      colors: ['Neon Green', 'Stealth Grey'],
      tags: ['gaming', '5g', 'fast charging', 'esports'],
    },
    {
      name: 'Connect 5G Lite',
      brand: 'Connect',
      category: '5G',
      description: 'Slim and lightweight 5G phone for professionals who need speed and all-day battery.',
      price: 18999,
      discountPrice: 16499,
      stock: 60,
      availability: 'PUBLISHED',
      isFeatured: false,
      specs: [
        { key: 'Display', value: '6.4" Super AMOLED 60Hz' },
        { key: 'Camera', value: '64MP + 5MP + 2MP' },
        { key: 'Battery', value: '4500mAh + 25W Fast Charge' },
        { key: 'RAM', value: '6GB' },
        { key: 'Storage', value: '128GB' },
        { key: 'Processor', value: 'Exynos 1280' },
        { key: 'OS', value: 'Android 13' },
        { key: 'Thickness', value: '6.4mm' },
      ],
      colors: ['White', 'Black', 'Lavender'],
      tags: ['5g', 'slim', 'professional'],
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
