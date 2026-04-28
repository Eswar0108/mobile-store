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

  console.log('Clearing existing products...');
  await prisma.product.deleteMany({});

  // Real products from top brands
  const products = [
    // ── Apple ──────────────────────────────────────────────────────────
    {
      name: 'Apple iPhone 15 Pro Max',
      brand: 'Apple',
      category: 'Flagship',
      description:
        'The most powerful iPhone ever. Titanium design with the A17 Pro chip, ProMotion display, and the most advanced camera system Apple has built — including 5x optical zoom and Action Button.',
      price: 134900,
      discountPrice: 124900,
      stock: 30,
      availability: 'PUBLISHED',
      isFeatured: true,
      images: [
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384147/mobile-store/products/apple-iphone-15-pro-max-1.jpg',
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384148/mobile-store/products/apple-iphone-15-pro-max-2.jpg',
      ],
      specs: [
        { key: 'Display', value: '6.7" Super Retina XDR OLED, ProMotion 120Hz, 2796×1290' },
        { key: 'Processor', value: 'Apple A17 Pro (3nm)' },
        { key: 'RAM', value: '8GB' },
        { key: 'Storage', value: '256GB / 512GB / 1TB' },
        { key: 'Rear Camera', value: '48MP Main + 12MP Ultrawide + 12MP 5x Telephoto' },
        { key: 'Front Camera', value: '12MP TrueDepth' },
        { key: 'Battery', value: '4422mAh, 27W Fast Charge, 15W MagSafe Wireless' },
        { key: 'OS', value: 'iOS 17, upgradable to iOS 18' },
        { key: 'Build', value: 'Grade 5 Titanium frame + Textured Matte Glass' },
        { key: 'Connectivity', value: 'Wi-Fi 6E, Bluetooth 5.3, UWB, USB-C 3.0' },
        { key: 'Water Resistance', value: 'IP68 (6m for 30 mins)' },
      ],
      colors: ['Black Titanium', 'White Titanium', 'Blue Titanium', 'Natural Titanium'],
      tags: ['apple', 'flagship', '5g', 'iphone', 'best seller', 'camera phone'],
    },
    {
      name: 'Apple iPhone 15',
      brand: 'Apple',
      category: 'Flagship',
      description:
        'iPhone 15 features Dynamic Island, a 48MP main camera with 2x optical zoom, and the powerful A16 Bionic chip — all in a colour-infused glass design with USB-C.',
      price: 79900,
      discountPrice: 74900,
      stock: 50,
      availability: 'PUBLISHED',
      isFeatured: true,
      images: [
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384150/mobile-store/products/apple-iphone-15-1.jpg',
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384151/mobile-store/products/apple-iphone-15-2.jpg',
      ],
      specs: [
        { key: 'Display', value: '6.1" Super Retina XDR OLED, 60Hz, 2556×1179' },
        { key: 'Processor', value: 'Apple A16 Bionic (4nm)' },
        { key: 'RAM', value: '6GB' },
        { key: 'Storage', value: '128GB / 256GB / 512GB' },
        { key: 'Rear Camera', value: '48MP Main (2x optical zoom) + 12MP Ultrawide' },
        { key: 'Front Camera', value: '12MP TrueDepth' },
        { key: 'Battery', value: '3349mAh, 20W Fast Charge, 15W MagSafe Wireless' },
        { key: 'OS', value: 'iOS 17, upgradable to iOS 18' },
        { key: 'Build', value: 'Aluminum frame + Colour-infused Glass back' },
        { key: 'Connectivity', value: 'Wi-Fi 6, Bluetooth 5.3, USB-C' },
        { key: 'Water Resistance', value: 'IP68 (6m for 30 mins)' },
      ],
      colors: ['Black', 'Blue', 'Green', 'Yellow', 'Pink'],
      tags: ['apple', 'flagship', '5g', 'iphone'],
    },
    // ── Samsung ────────────────────────────────────────────────────────
    {
      name: 'Samsung Galaxy S24 Ultra',
      brand: 'Samsung',
      category: 'Flagship',
      description:
        'The pinnacle of Galaxy. S24 Ultra comes with an integrated S Pen, 200MP camera, 100x Space Zoom, titanium frame, and Galaxy AI features built in.',
      price: 129999,
      discountPrice: 119999,
      stock: 25,
      availability: 'PUBLISHED',
      isFeatured: true,
      images: [
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384656/mobile-store/products/samsung-galaxy-s24-ultra-1.jpg',
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384657/mobile-store/products/samsung-galaxy-s24-ultra-2.jpg',
      ],
      specs: [
        { key: 'Display', value: '6.8" Dynamic LTPO3 AMOLED 2X, 120Hz, 3088×1440, 2600 nits peak' },
        { key: 'Processor', value: 'Snapdragon 8 Gen 3 (4nm)' },
        { key: 'RAM', value: '12GB' },
        { key: 'Storage', value: '256GB / 512GB / 1TB' },
        { key: 'Rear Camera', value: '200MP Main + 12MP Ultrawide + 10MP 3x + 50MP 5x Telephoto' },
        { key: 'Front Camera', value: '12MP' },
        { key: 'Battery', value: '5000mAh, 45W Fast Charge, 15W Wireless' },
        { key: 'OS', value: 'Android 14, One UI 6.1 (upgradable to Android 15)' },
        { key: 'Build', value: 'Titanium frame + Corning Gorilla Glass Armor' },
        { key: 'S Pen', value: 'Integrated S Pen with 2.8ms latency' },
        { key: 'Water Resistance', value: 'IP68' },
      ],
      colors: ['Titanium Black', 'Titanium Grey', 'Titanium Violet', 'Titanium Yellow'],
      tags: ['samsung', 'flagship', '5g', 's-pen', 'best seller', 'camera phone'],
    },
    {
      name: 'Samsung Galaxy S24',
      brand: 'Samsung',
      category: 'Flagship',
      description:
        'Galaxy S24 brings Galaxy AI to everyone with a compact 6.2" display, Snapdragon 8 Gen 3, and a versatile triple camera system.',
      price: 74999,
      discountPrice: 69999,
      stock: 40,
      availability: 'PUBLISHED',
      isFeatured: false,
      images: [
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384658/mobile-store/products/samsung-galaxy-s24-1.jpg',
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384659/mobile-store/products/samsung-galaxy-s24-2.jpg',
      ],
      specs: [
        { key: 'Display', value: '6.2" Dynamic AMOLED 2X, 120Hz, 2340×1080' },
        { key: 'Processor', value: 'Snapdragon 8 Gen 3 (4nm)' },
        { key: 'RAM', value: '8GB' },
        { key: 'Storage', value: '128GB / 256GB' },
        { key: 'Rear Camera', value: '50MP Main + 12MP Ultrawide + 10MP 3x Telephoto' },
        { key: 'Front Camera', value: '12MP' },
        { key: 'Battery', value: '4000mAh, 25W Fast Charge, 15W Wireless' },
        { key: 'OS', value: 'Android 14, One UI 6.1' },
        { key: 'Build', value: 'Armor Aluminum frame + Corning Gorilla Glass Victus 2' },
        { key: 'Water Resistance', value: 'IP68' },
      ],
      colors: ['Onyx Black', 'Marble Grey', 'Cobalt Violet', 'Amber Yellow'],
      tags: ['samsung', 'flagship', '5g'],
    },
    {
      name: 'Samsung Galaxy A55 5G',
      brand: 'Samsung',
      category: '5G',
      description:
        'Galaxy A55 5G brings an Exynos 1480 processor, 50MP OIS camera, and IP67 durability to the mid-range — with 4 OS upgrades guaranteed.',
      price: 34999,
      discountPrice: 32999,
      stock: 70,
      availability: 'PUBLISHED',
      isFeatured: false,
      images: [
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384234/mobile-store/products/samsung-galaxy-a55-1.jpg',
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384235/mobile-store/products/samsung-galaxy-a55-2.jpg',
      ],
      specs: [
        { key: 'Display', value: '6.6" Super AMOLED, 120Hz, 2340×1080' },
        { key: 'Processor', value: 'Exynos 1480 (4nm)' },
        { key: 'RAM', value: '8GB' },
        { key: 'Storage', value: '128GB / 256GB (expandable)' },
        { key: 'Rear Camera', value: '50MP OIS + 12MP Ultrawide + 5MP Macro' },
        { key: 'Front Camera', value: '32MP' },
        { key: 'Battery', value: '5000mAh, 25W Fast Charge' },
        { key: 'OS', value: 'Android 14, One UI 6.1 (4 OS upgrades)' },
        { key: 'Water Resistance', value: 'IP67' },
        { key: 'Security', value: 'In-display fingerprint scanner' },
      ],
      colors: ['Awesome Iceblue', 'Awesome Lilac', 'Awesome Navy', 'Awesome Lemon'],
      tags: ['samsung', '5g', 'mid-range', 'ip67'],
    },
    // ── Xiaomi ─────────────────────────────────────────────────────────
    {
      name: 'Xiaomi 14 Ultra',
      brand: 'Xiaomi',
      category: 'Camera Phone',
      description:
        'The ultimate photography phone co-engineered with Leica. Xiaomi 14 Ultra packs a 1-inch Sony LYT-900 sensor, Leica Summilux lenses, Snapdragon 8 Gen 3, and a 90W HyperCharge system.',
      price: 99999,
      discountPrice: 94999,
      stock: 20,
      availability: 'PUBLISHED',
      isFeatured: true,
      images: [
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384159/mobile-store/products/xiaomi-14-ultra-1.jpg',
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384161/mobile-store/products/xiaomi-14-ultra-2.jpg',
      ],
      specs: [
        { key: 'Display', value: '6.73" LTPO AMOLED, 120Hz, 3200×1440, 3000 nits peak' },
        { key: 'Processor', value: 'Snapdragon 8 Gen 3 (4nm)' },
        { key: 'RAM', value: '16GB LPDDR5X' },
        { key: 'Storage', value: '512GB UFS 4.0' },
        { key: 'Rear Camera', value: '50MP 1" Sony LYT-900 + 50MP 75mm Portrait + 50MP 120mm Periscope + 12MP Ultrawide (all Leica Summilux)' },
        { key: 'Front Camera', value: '32MP' },
        { key: 'Battery', value: '5300mAh, 90W HyperCharge, 80W Wireless' },
        { key: 'OS', value: 'Android 14, MIUI 15' },
        { key: 'Build', value: 'Nano-tech Matte Ceramic back, Titanium-grade aluminum frame' },
        { key: 'Camera Collab', value: 'Leica Summilux lenses with Authentic & Vibrant modes' },
      ],
      colors: ['Black', 'White', 'Dragon Crystal Special Edition'],
      tags: ['xiaomi', 'flagship', '5g', 'leica', 'camera phone', 'best seller'],
    },
    {
      name: 'Redmi Note 13 Pro+ 5G',
      brand: 'Xiaomi',
      category: '5G',
      description:
        'Redmi Note 13 Pro+ 5G packs a 200MP camera, 120W HyperCharge, and IP68 waterproofing into an ultra-thin curved glass body — setting a new standard for mid-range phones.',
      price: 29999,
      discountPrice: 26999,
      stock: 100,
      availability: 'PUBLISHED',
      isFeatured: true,
      images: [
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384162/mobile-store/products/redmi-note-13-pro-plus-1.jpg',
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384163/mobile-store/products/redmi-note-13-pro-plus-2.jpg',
      ],
      specs: [
        { key: 'Display', value: '6.67" Curved AMOLED, 120Hz, 2712×1220, 1800 nits' },
        { key: 'Processor', value: 'Dimensity 7200-Ultra (4nm)' },
        { key: 'RAM', value: '8GB / 12GB LPDDR5' },
        { key: 'Storage', value: '256GB UFS 3.1' },
        { key: 'Rear Camera', value: '200MP OIS + 8MP Ultrawide + 2MP Macro' },
        { key: 'Front Camera', value: '16MP' },
        { key: 'Battery', value: '5000mAh, 120W HyperCharge (19 mins 0→100%)' },
        { key: 'OS', value: 'Android 13, MIUI 14' },
        { key: 'Water Resistance', value: 'IP68' },
        { key: 'Connectivity', value: '5G (SA + NSA), Wi-Fi 6' },
      ],
      colors: ['Aurora Purple', 'Midnight Black', 'Fusion White'],
      tags: ['xiaomi', 'redmi', '5g', 'fast charging', '200mp', 'ip68'],
    },
    // ── Realme ─────────────────────────────────────────────────────────
    {
      name: 'Realme GT 6',
      brand: 'Realme',
      category: 'Gaming',
      description:
        'Realme GT 6 is the first phone with the Snapdragon 8s Gen 3 chip, a 6000-nit AI-adaptive display, and 120W SUPERVOOC charging — made for gamers and speed enthusiasts.',
      price: 39999,
      discountPrice: 34999,
      stock: 55,
      availability: 'PUBLISHED',
      isFeatured: false,
      images: [
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384664/mobile-store/products/realme-gt-6-1.jpg',
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384665/mobile-store/products/realme-gt-6-2.jpg',
      ],
      specs: [
        { key: 'Display', value: '6.78" BOE ProXDR AMOLED, 120Hz, 6000 nits peak brightness' },
        { key: 'Processor', value: 'Snapdragon 8s Gen 3 (4nm)' },
        { key: 'RAM', value: '12GB LPDDR5X' },
        { key: 'Storage', value: '256GB UFS 4.0' },
        { key: 'Rear Camera', value: '50MP Sony LYT-808 OIS + 8MP Ultrawide' },
        { key: 'Front Camera', value: '32MP' },
        { key: 'Battery', value: '5500mAh, 120W SUPERVOOC (26 mins full charge)' },
        { key: 'OS', value: 'Android 14, realme UI 5.0' },
        { key: 'Cooling', value: 'Dual Vapour Chamber thermal system' },
        { key: 'Connectivity', value: '5G, Wi-Fi 7, Bluetooth 5.4' },
      ],
      colors: ['Fluid Silver', 'Razor Green'],
      tags: ['realme', 'gaming', '5g', 'fast charging', 'high refresh rate'],
    },
    {
      name: 'Realme Narzo 70 Pro 5G',
      brand: 'Realme',
      category: '5G',
      description:
        'Realme Narzo 70 Pro 5G offers a stunning 3D curved AMOLED display, Dimensity 7050 chipset, and 67W SUPERVOOC charging at an aggressive mid-range price.',
      price: 19999,
      discountPrice: 17999,
      stock: 90,
      availability: 'PUBLISHED',
      isFeatured: false,
      images: [
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384660/mobile-store/products/realme-narzo-70-pro-1.jpg',
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384662/mobile-store/products/realme-narzo-70-pro-2.jpg',
      ],
      specs: [
        { key: 'Display', value: '6.7" 3D Curved AMOLED, 120Hz, 2412×1080' },
        { key: 'Processor', value: 'Dimensity 7050 (6nm)' },
        { key: 'RAM', value: '8GB LPDDR4X' },
        { key: 'Storage', value: '128GB / 256GB UFS 2.2 (expandable)' },
        { key: 'Rear Camera', value: '50MP Sony IMX890 OIS + 8MP Ultrawide' },
        { key: 'Front Camera', value: '16MP' },
        { key: 'Battery', value: '5000mAh, 67W SUPERVOOC (46 mins full charge)' },
        { key: 'OS', value: 'Android 14, realme UI 5.0' },
        { key: 'Connectivity', value: '5G (SA + NSA), Wi-Fi 6' },
      ],
      colors: ['Glass Green', 'Glass Gold'],
      tags: ['realme', '5g', 'mid-range', 'amoled', 'value for money'],
    },
    // ── OnePlus ────────────────────────────────────────────────────────
    {
      name: 'OnePlus 12',
      brand: 'OnePlus',
      category: 'Flagship',
      description:
        'OnePlus 12 combines the Snapdragon 8 Gen 3, co-engineered Hasselblad cameras with a 1/1.4" Sony LYT-808 sensor, and 100W SUPERVOOC charging into the most capable OnePlus ever.',
      price: 64999,
      discountPrice: 59999,
      stock: 45,
      availability: 'PUBLISHED',
      isFeatured: true,
      images: [
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384168/mobile-store/products/oneplus-12-1.jpg',
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384170/mobile-store/products/oneplus-12-2.jpg',
      ],
      specs: [
        { key: 'Display', value: '6.82" LTPO3 ProXDR AMOLED, 1~120Hz, 3168×1440, 4500 nits' },
        { key: 'Processor', value: 'Snapdragon 8 Gen 3 (4nm)' },
        { key: 'RAM', value: '12GB / 16GB LPDDR5X' },
        { key: 'Storage', value: '256GB / 512GB UFS 4.0' },
        { key: 'Rear Camera', value: '50MP Sony LYT-808 1/1.4" OIS + 48MP Ultrawide + 64MP 3x Periscope (Hasselblad Natural Color)' },
        { key: 'Front Camera', value: '32MP' },
        { key: 'Battery', value: '5400mAh, 100W SUPERVOOC, 50W AirVOOC Wireless' },
        { key: 'OS', value: 'Android 14, OxygenOS 14' },
        { key: 'Connectivity', value: 'Wi-Fi 7, Bluetooth 5.4, USB 3.2 Gen 2' },
        { key: 'Camera Collab', value: 'Hasselblad Natural Color Calibration + Hasselblad Pro Mode' },
      ],
      colors: ['Silky Black', 'Flowy Emerald'],
      tags: ['oneplus', 'flagship', '5g', 'hasselblad', 'camera phone', 'best seller'],
    },
    {
      name: 'OnePlus Nord CE 4',
      brand: 'OnePlus',
      category: '5G',
      description:
        'OnePlus Nord CE 4 brings Snapdragon 7 Gen 3, a 50MP Sony IMX890 OIS camera, and 100W SUPERVOOC charging to the affordable 5G segment — with OxygenOS fluidity.',
      price: 24999,
      discountPrice: 22999,
      stock: 80,
      availability: 'PUBLISHED',
      isFeatured: false,
      images: [
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384667/mobile-store/products/oneplus-nord-ce4-2.jpg',
        'https://res.cloudinary.com/dznbavf8l/image/upload/v1777384669/mobile-store/products/oneplus-nord-ce4-3.jpg',
      ],
      specs: [
        { key: 'Display', value: '6.7" Fluid AMOLED, 120Hz, 2412×1080' },
        { key: 'Processor', value: 'Snapdragon 7 Gen 3 (4nm)' },
        { key: 'RAM', value: '8GB LPDDR4X' },
        { key: 'Storage', value: '128GB / 256GB UFS 3.1' },
        { key: 'Rear Camera', value: '50MP Sony IMX890 OIS + 8MP Ultrawide' },
        { key: 'Front Camera', value: '16MP' },
        { key: 'Battery', value: '5500mAh, 100W SUPERVOOC (29 mins full charge)' },
        { key: 'OS', value: 'Android 14, OxygenOS 14' },
        { key: 'Connectivity', value: '5G, Wi-Fi 6, Bluetooth 5.4' },
        { key: 'Security', value: 'In-display fingerprint sensor' },
      ],
      colors: ['Dark Chrome', 'Celadon Marble'],
      tags: ['oneplus', '5g', 'mid-range', 'fast charging', 'value for money'],
    },
  ];

  for (const p of products) {
    const slug = p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await prisma.product.create({
      data: {
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
        images: {
          create: p.images.map((url, i) => ({ url, isPrimary: i === 0, sortOrder: i })),
        },
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
