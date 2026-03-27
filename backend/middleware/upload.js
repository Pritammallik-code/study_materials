const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage to memory (no local files created)
const storage = multer.memoryStorage();

// File filter (Optional: restrict to certain types)
const fileFilter = (req, file, cb) => {
    // Allow all files for now, but still limit size in the multer config
    cb(null, true);
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = upload;
