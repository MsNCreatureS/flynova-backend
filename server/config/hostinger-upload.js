const FtpDeploy = require('ftp-deploy');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuration FTP Hostinger
const ftpConfig = {
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  host: process.env.FTP_HOST,
  port: process.env.FTP_PORT || 21,
  localRoot: path.join(__dirname, '../../public/uploads'),
  remoteRoot: process.env.FTP_REMOTE_ROOT || '/public_html/uploads/',
  include: ['*', '**/*'],
  deleteRemote: false,
  forcePasv: true
};

// Upload un fichier vers Hostinger via FTP
const uploadToHostinger = async (localPath, remotePath) => {
  const ftpDeploy = new FtpDeploy();
  
  try {
    await ftpDeploy.deploy({
      ...ftpConfig,
      localRoot: path.dirname(localPath),
      remoteRoot: path.dirname(remotePath),
      include: [path.basename(localPath)]
    });
    
    console.log(`✅ File uploaded to Hostinger: ${remotePath}`);
    return true;
  } catch (error) {
    console.error('❌ FTP upload error:', error);
    throw error;
  }
};

// Storage local temporaire avant upload FTP
const createMulterStorage = (folder) => {
  return multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../public/uploads', folder);
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = folder.slice(0, -1) + '-' + uniqueSuffix + path.extname(file.originalname);
      cb(null, filename);
    }
  });
};

// Middleware pour upload avatar avec FTP
const uploadAvatarWithFTP = multer({
  storage: createMulterStorage('avatars'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Middleware pour upload logo avec FTP
const uploadLogoWithFTP = multer({
  storage: createMulterStorage('logos'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Middleware pour upload livrée avec FTP
const uploadLiveryWithFTP = multer({
  storage: createMulterStorage('liveries'),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Middleware pour upload événement avec FTP
const uploadEventWithFTP = multer({
  storage: createMulterStorage('events'),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Middleware pour upload document avec FTP
const uploadDocumentWithFTP = multer({
  storage: createMulterStorage('documents'),
  limits: { fileSize: 20 * 1024 * 1024 }
});

// Fonction pour construire l'URL publique
const getPublicUrl = (relativePath) => {
  const baseUrl = process.env.UPLOADS_BASE_URL || 'https://yourdomain.com/uploads';
  return `${baseUrl}${relativePath}`;
};

module.exports = {
  uploadToHostinger,
  uploadAvatarWithFTP,
  uploadLogoWithFTP,
  uploadLiveryWithFTP,
  uploadEventWithFTP,
  uploadDocumentWithFTP,
  getPublicUrl
};
