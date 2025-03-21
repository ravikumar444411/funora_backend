const express = require("express");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");
const upload = require("../middlewares/upload");
const dotenv = require("dotenv");

dotenv.config();

const router = express.Router();

router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const bucketName = process.env.AWS_BUCKET_NAME; // ✅ Read from .env
        if (!bucketName) {
            throw new Error("S3 Bucket name is not defined in .env 2", bucketName);
        }

        const fileKey = `uploads/${Date.now()}-${req.file.originalname}`;

        const uploadParams = {
            Bucket: bucketName, // ✅ Use bucket name from .env
            Key: fileKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        };

        const command = new PutObjectCommand(uploadParams);
        await s3.send(command);

        let filePath = `${process.env.BUCKET_BASE_URL}/${fileKey}`
        res.json({ message: "File uploaded successfully", filePath });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "File upload failed" });
    }
});

// const uploadToS3 = async (file) => {

//     const bucketName = process.env.AWS_BUCKET_NAME; // ✅ Read from .env
//     if (!bucketName) {
//         throw new Error("S3 Bucket name is not defined in .env 2", bucketName);
//     }

//     const params = {
//         Bucket: bucketName,
//         Key: `events/${Date.now()}_${file.originalname}`,
//         Body: file.buffer,
//         ACL: "public-read",
//         ContentType: file.mimetype
//     };

//     const uploadResult = await s3.upload(params).promise();
//     return uploadResult.Location;
// };

module.exports = router; // ✅ Use module.exports
