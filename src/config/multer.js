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
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4"];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type"), false);
    }
};

const storage = multer.memoryStorage();
const upload = multer({ storage, fileFilter });
// const upload = multer({ storage: storage });

module.exports = upload;
