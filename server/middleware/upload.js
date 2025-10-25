const { uploadAvatar, uploadLogo, uploadLivery, uploadEvent, uploadDocument } = require('../config/cloudinary');

// Middleware pour gérer les erreurs d'upload
const handleUploadError = (err, req, res, next) => {
  if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({ 
      error: 'Upload failed', 
      message: err.message 
    });
  }
  next();
};

// Middleware pour upload avatar
const uploadAvatarMiddleware = (req, res, next) => {
  uploadAvatar.single('avatar')(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    
    // Ajouter l'URL Cloudinary à req.file
    if (req.file) {
      req.file.cloudinaryUrl = req.file.path;
    }
    next();
  });
};

// Middleware pour upload logo VA
const uploadLogoMiddleware = (req, res, next) => {
  uploadLogo.single('logo')(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    
    if (req.file) {
      req.file.cloudinaryUrl = req.file.path;
    }
    next();
  });
};

// Middleware pour upload livrée
const uploadLiveryMiddleware = (req, res, next) => {
  uploadLivery.single('livery')(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    
    if (req.file) {
      req.file.cloudinaryUrl = req.file.path;
    }
    next();
  });
};

// Middleware pour upload image événement
const uploadEventMiddleware = (req, res, next) => {
  uploadEvent.single('image')(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    
    if (req.file) {
      req.file.cloudinaryUrl = req.file.path;
    }
    next();
  });
};

// Middleware pour upload document
const uploadDocumentMiddleware = (req, res, next) => {
  uploadDocument.single('document')(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    
    if (req.file) {
      req.file.cloudinaryUrl = req.file.path;
    }
    next();
  });
};

module.exports = {
  uploadAvatarMiddleware,
  uploadLogoMiddleware,
  uploadLiveryMiddleware,
  uploadEventMiddleware,
  uploadDocumentMiddleware,
};
