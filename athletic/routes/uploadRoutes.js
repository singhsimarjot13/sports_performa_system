const express = require('express');
const router = express.Router();
const multer = require('multer');
const { previewDocx, saveFinalData } = require('../controllers/uploadController');

// Multer setup
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// Route for previewing the DOCX content (no DB save)
router.post('/upload-preview', upload.single('docfile'), previewDocx);

// Route for final submission (save to DB)
router.post('/upload-final', saveFinalData);

module.exports = router;

