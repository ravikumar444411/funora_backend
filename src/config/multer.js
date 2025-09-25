const multer = require("multer");
const path = require("path");

// // Set Storage Engine
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, "uploads/"); // Save locally before uploading to S3
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });

// File Filter for Images/Videos
const fileFilter = (req, file, cb) => {
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".mp4"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(null, false); // reject silently
        // OR send custom error:
        // cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
};

const storage = multer.memoryStorage();
const upload = multer({ storage, fileFilter });
// const upload = multer({ storage: storage });

module.exports = upload;
