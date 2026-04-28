const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mobilestore/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  },
});

const returnStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mobilestore/returns',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mobilestore/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
});

const uploadProductImages = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).array('images', 10);

const uploadReturnImages = multer({
  storage: returnStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array('images', 3);

const uploadProfilePhoto = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single('photo');

const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete failed:', err.message);
  }
};

module.exports = { uploadProductImages, uploadReturnImages, uploadProfilePhoto, deleteImage, cloudinary };
