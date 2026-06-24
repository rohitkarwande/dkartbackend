const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads/csv');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept csv only
    if (!file.originalname.match(/\.(csv|CSV)$/)) {
        req.fileValidationError = 'Only CSV files are allowed!';
        return cb(new Error('Only CSV files are allowed!'), false);
    }
    if (file.mimetype !== 'text/csv' && file.mimetype !== 'application/vnd.ms-excel') {
        req.fileValidationError = 'Only CSV files are allowed!';
        return cb(new Error('Only CSV files are allowed!'), false);
    }
    cb(null, true);
};

const uploadCsv = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter 
});

module.exports = uploadCsv;
