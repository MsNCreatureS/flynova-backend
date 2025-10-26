const { uploadAvatar, uploadLogo, uploadLivery, uploadEvent, uploadDocument, uploadBugImage, uploadToHostinger } = require('../config/hostinger-upload');

// Middleware pour gérer les erreurs d'upload
const handleUploadError = (err, req, res, next) => {
  if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({ 
      error: 'Upload failed', 
      message: err.message,
      code: err.code
    });
  }
  next();
};

// Middleware pour upload avatar
const uploadAvatarMiddleware = (req, res, next) => {
  console.log('uploadAvatarMiddleware called');
  uploadAvatar.single('avatar')(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return handleUploadError(err, req, res, next);
    }
    
    console.log('File after multer:', req.file);
    
    // Upload vers Hostinger FTP et obtenir l'URL publique
    if (req.file) {
      try {
        console.log('Starting FTP upload for:', req.file.path);
        const publicUrl = await uploadToHostinger(req.file.path, 'avatars');
        console.log('FTP upload success:', publicUrl);
        req.file.publicUrl = publicUrl;
        req.file.path = publicUrl; // Pour compatibilité avec le code existant
      } catch (uploadError) {
        console.error('FTP upload error:', uploadError);
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

// Middleware pour upload image de bug report
const uploadBugImageMiddleware = (req, res, next) => {
  uploadBugImage.single('image')(req, res, async (err) => {
    if (err) return handleUploadError(err, req, res, next);
    
    if (req.file) {
      try {
        const publicUrl = await uploadToHostinger(req.file.path, 'bugs');
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
  uploadBugImageMiddleware,
};
