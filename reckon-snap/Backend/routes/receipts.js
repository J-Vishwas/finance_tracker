const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Simple disk storage for uploaded files (temp). In production, use cloud storage.
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = [
            'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
            'application/pdf'
        ];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        cb(new Error('Unsupported file type. Upload images or PDF only.'));
    }
});

// Placeholder OCR extraction. Replace with Tesseract.js or external service.
async function extractReceiptData(filePath) {
    // For now, return a minimal structure; hook up real OCR later.
    return {
        merchant: 'Unknown',
        date: new Date().toISOString(),
        total: 0,
        items: []
    };
}

// POST /api/receipts/extract -> upload and extract data
router.post('/extract', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'File is required' });
        }

        const filePath = req.file.path;
        const parsed = await extractReceiptData(filePath);

        res.json({
            filename: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            parsed
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;


