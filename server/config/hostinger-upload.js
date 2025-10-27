const FtpDeploy = require('ftp-deploy');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuration FTP
const ftpConfig = {
  host: process.env.FTP_HOST,
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  port: process.env.FTP_PORT || 21,
  localRoot: path.join(__dirname, '../../public/uploads'),
  remoteRoot: process.env.FTP_REMOTE_ROOT || '/public_html/uploads/',
  include: ['*', '**/*'],
  deleteRemote: false,
  forcePasv: true,
};

// Configuration Multer pour stockage temporaire local
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let uploadDir = path.join(__dirname, '../../public/uploads');
    
    // Déterminer le sous-dossier selon le type de fichier
    if (file.fieldname === 'avatar') {
      uploadDir = path.join(uploadDir, 'avatars');
    } else if (file.fieldname === 'logo') {
      uploadDir = path.join(uploadDir, 'logos');
    } else if (file.fieldname === 'livery') {
      uploadDir = path.join(uploadDir, 'liveries');
    } else if (file.fieldname === 'image') {
      uploadDir = path.join(uploadDir, 'events');
    } else if (file.fieldname === 'document') {
      uploadDir = path.join(uploadDir, 'documents');
    } else if (file.fieldname === 'audio') {
      uploadDir = path.join(uploadDir, 'announcements');
    } else if (file.fieldname === 'banner_image') {
      uploadDir = path.join(uploadDir, 'tours/banners');
    } else if (file.fieldname === 'award_image') {
      uploadDir = path.join(uploadDir, 'tours/awards');
    }

    // Créer le dossier s'il n'existe pas
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.error('Error creating directory:', err);
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Filtres de fichiers
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const documentFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only document files are allowed (pdf, doc, docx, txt)'));
  }
};

const audioFilter = (req, file, cb) => {
  const allowedTypes = /mp3|wav|ogg|m4a/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /audio/.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed (mp3, wav, ogg, m4a)'));
  }
};

// Multer instances
const uploadAvatar = multer({ 
  storage, 
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadLogo = multer({ 
  storage, 
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadLivery = multer({ 
  storage, 
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadEvent = multer({ 
  storage, 
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadDocument = multer({ 
  storage, 
  fileFilter: documentFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

const uploadBugImage = multer({ 
  storage, 
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadCabinAnnouncement = multer({ 
  storage, 
  fileFilter: audioFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadTour = multer({ 
  storage, 
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).fields([
  { name: 'banner_image', maxCount: 1 },
  { name: 'award_image', maxCount: 1 }
]);

/**
 * Upload un fichier vers Hostinger via FTP
 * @param {string} localFilePath - Chemin local du fichier
 * @param {string} subfolder - Sous-dossier (avatars, logos, etc.)
 * @returns {Promise<string>} URL publique du fichier
 */
async function uploadToHostinger(localFilePath, subfolder) {
  try {
    const ftpDeploy = new FtpDeploy();
    const filename = path.basename(localFilePath);
    const localDir = path.dirname(localFilePath);

    // Configuration FTP spécifique pour ce fichier
    const config = {
      ...ftpConfig,
      localRoot: localDir,
      remoteRoot: `${ftpConfig.remoteRoot}${subfolder}/`,
      include: [filename],
    };

    console.log(`📤 Uploading ${filename} to Hostinger FTP...`);

    await ftpDeploy.deploy(config);

    // Construire l'URL publique
    const baseUrl = process.env.UPLOADS_BASE_URL || 'https://darkblue-baboon-659394.hostingersite.com/uploads';
    const publicUrl = `${baseUrl}/${subfolder}/${filename}`;

    console.log(`✅ File uploaded: ${publicUrl}`);

    // Supprimer le fichier local après l'upload (optionnel)
    try {
      await fs.unlink(localFilePath);
      console.log(`🗑️  Local file deleted: ${localFilePath}`);
    } catch (err) {
      console.warn('Could not delete local file:', err.message);
    }

    return publicUrl;
  } catch (error) {
    console.error('❌ FTP upload error:', error);
    throw new Error(`FTP upload failed: ${error.message}`);
  }
}

/**
 * Obtenir l'URL publique d'un fichier
 * @param {string} subfolder - Sous-dossier
 * @param {string} filename - Nom du fichier
 * @returns {string} URL publique
 */
function getPublicUrl(subfolder, filename) {
  const baseUrl = process.env.UPLOADS_BASE_URL || 'https://darkblue-baboon-659394.hostingersite.com/uploads';
  return `${baseUrl}/${subfolder}/${filename}`;
}

module.exports = {
  uploadAvatar,
  uploadLogo,
  uploadLivery,
  uploadEvent,
  uploadDocument,
  uploadBugImage,
  uploadCabinAnnouncement,
  uploadTour,
  uploadToHostinger,
  getPublicUrl,
};
