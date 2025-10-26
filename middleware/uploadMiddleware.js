const multer = require('multer');
const path = require('path');
const config = require('../config');
const { ensureDir } = require('../utils/fileUtils');

// Setup multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureDir(config.upload.uploadDir);
    cb(null, config.upload.uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Allow image and PDF files
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('只允許上傳圖片文件或PDF文件！'), false);
    }
  },
  limits: {
    fileSize: config.upload.maxFileSize
  }
});

// Error handling middleware for multer
function handleUploadError(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: `文件大小不能超過 ${config.upload.maxFileSize / (1024 * 1024)}MB`
      });
    }
  }
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
}

module.exports = {
  upload,
  handleUploadError
};
