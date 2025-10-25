const { uploadAvatar, uploadLogo, uploadLivery, uploadEvent, uploadDocument, uploadToHostinger } = require('../config/hostinger-upload');

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
  uploadAvatar.single('avatar')(req, res, async (err) => {
    if (err) return handleUploadError(err, req, res, next);
    
    // Upload vers Hostinger FTP et obtenir l'URL publique
    if (req.file) {
      try {
        const publicUrl = await uploadToHostinger(req.file.path, 'avatars');
        req.file.publicUrl = publicUrl;
        req.file.path = publicUrl; // Pour compatibilité avec le code existant
      } catch (uploadError) {
        return handleUploadError(uploadError, req, res, next);
      }
    }
    next();
  });
};

// Middleware pour upload logo VA
const uploadLogoMiddleware = (req, res, next) => {
  uploadLogo.single('logo')(req, res, async (err) => {
    if (err) return handleUploadError(err, req, res, next);
    
    if (req.file) {
      try {
        const publicUrl = await uploadToHostinger(req.file.path, 'logos');
        req.file.publicUrl = publicUrl;
        req.file.path = publicUrl;
      } catch (uploadError) {
        return handleUploadError(uploadError, req, res, next);
      }
    }
    next();
  });
};

// Middleware pour upload livrée
const uploadLiveryMiddleware = (req, res, next) => {
  uploadLivery.single('livery')(req, res, async (err) => {
    if (err) return handleUploadError(err, req, res, next);
    
    if (req.file) {
      try {
        const publicUrl = await uploadToHostinger(req.file.path, 'liveries');
        req.file.publicUrl = publicUrl;
        req.file.path = publicUrl;
      } catch (uploadError) {
        return handleUploadError(uploadError, req, res, next);
      }
    }
    next();
  });
};

// Middleware pour upload image événement
const uploadEventMiddleware = (req, res, next) => {
  uploadEvent.single('image')(req, res, async (err) => {
    if (err) return handleUploadError(err, req, res, next);
    
    if (req.file) {
      try {
        const publicUrl = await uploadToHostinger(req.file.path, 'events');
        req.file.publicUrl = publicUrl;
        req.file.path = publicUrl;
      } catch (uploadError) {
        return handleUploadError(uploadError, req, res, next);
      }
    }
    next();
  });
};

// Middleware pour upload document
const uploadDocumentMiddleware = (req, res, next) => {
  uploadDocument.single('document')(req, res, async (err) => {
    if (err) return handleUploadError(err, req, res, next);
    
    if (req.file) {
      try {
        const publicUrl = await uploadToHostinger(req.file.path, 'documents');
        req.file.publicUrl = publicUrl;
        req.file.path = publicUrl;
      } catch (uploadError) {
        return handleUploadError(uploadError, req, res, next);
      }
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
