// Run: node scripts/upload-images.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dznbavf8l',
  api_key: '346319143333493',
  api_secret: '6T_jbmAYnUZd7jxhxTmr9iu-v3Q',
});

const phones = [
  // Apple
  {
    id: 'apple-iphone-15-pro-max',
    urls: [
      'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-2.jpg',
    ],
  },
  {
    id: 'apple-iphone-15',
    urls: [
      'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-2.jpg',
    ],
  },
  // Samsung
  {
    id: 'samsung-galaxy-s24-ultra',
    urls: [
      'https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-ultra-5g-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-ultra-5g-2.jpg',
    ],
  },
  {
    id: 'samsung-galaxy-s24',
    urls: [
      'https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-5g-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-5g-2.jpg',
    ],
  },
  {
    id: 'samsung-galaxy-a55',
    urls: [
      'https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-a55-5g-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-a55-5g-2.jpg',
    ],
  },
  // Xiaomi
  {
    id: 'xiaomi-14-ultra',
    urls: [
      'https://fdn2.gsmarena.com/vv/pics/xiaomi/xiaomi-14-ultra-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/xiaomi/xiaomi-14-ultra-2.jpg',
    ],
  },
  {
    id: 'redmi-note-13-pro-plus',
    urls: [
      'https://fdn2.gsmarena.com/vv/pics/xiaomi/xiaomi-redmi-note-13-pro-plus-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/xiaomi/xiaomi-redmi-note-13-pro-plus-2.jpg',
    ],
  },
  // Realme
  {
    id: 'realme-gt-6',
    urls: [
      'https://fdn2.gsmarena.com/vv/pics/realme/realme-gt-6-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/realme/realme-gt-6-2.jpg',
    ],
  },
  {
    id: 'realme-narzo-70-pro',
    urls: [
      'https://fdn2.gsmarena.com/vv/pics/realme/realme-narzo-70-pro-5g-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/realme/realme-narzo-70-pro-5g-2.jpg',
    ],
  },
  // OnePlus
  {
    id: 'oneplus-12',
    urls: [
      'https://fdn2.gsmarena.com/vv/pics/oneplus/oneplus-12-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/oneplus/oneplus-12-2.jpg',
    ],
  },
  {
    id: 'oneplus-nord-ce4',
    urls: [
      'https://fdn2.gsmarena.com/vv/pics/oneplus/oneplus-nord-ce-4-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/oneplus/oneplus-nord-ce-4-2.jpg',
    ],
  },
];

async function uploadAll() {
  const results = {};

  for (const phone of phones) {
    const imageUrls = [];
    for (let i = 0; i < phone.urls.length; i++) {
      try {
        const res = await cloudinary.uploader.upload(phone.urls[i], {
          folder: 'mobile-store/products',
          public_id: `${phone.id}-${i + 1}`,
          overwrite: true,
          resource_type: 'image',
        });
        imageUrls.push(res.secure_url);
        console.log(`✓ ${phone.id} [${i + 1}]: ${res.secure_url}`);
      } catch (err) {
        console.error(`✗ ${phone.id} [${i + 1}]: ${err.message}`);
        imageUrls.push(null);
      }
    }
    results[phone.id] = imageUrls.filter(Boolean);
  }

  console.log('\n\n=== RESULTS JSON ===');
  console.log(JSON.stringify(results, null, 2));
}

uploadAll();
