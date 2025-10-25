const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage pour les avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'flynova/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
});

// Storage pour les logos de VA
const logoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'flynova/logos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'svg'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});

// Storage pour les livrées
const liveryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'flynova/liveries',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 1920, height: 1080, crop: 'limit' }],
  },
});

// Storage pour les événements
const eventStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'flynova/events',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 1200, height: 630, crop: 'limit' }],
  },
});

// Storage pour les documents
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'flynova/documents',
    allowed_formats: ['pdf', 'doc', 'docx', 'txt'],
    resource_type: 'raw', // Pour les fichiers non-image
  },
});

// Créer les uploaders multer
const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

const uploadLogo = multer({ 
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

const uploadLivery = multer({ 
  storage: liveryStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

const uploadEvent = multer({ 
  storage: eventStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

const uploadDocument = multer({ 
  storage: documentStorage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB max
});

// Fonction pour supprimer une image
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadAvatar,
  uploadLogo,
  uploadLivery,
  uploadEvent,
  uploadDocument,
  deleteImage,
};
