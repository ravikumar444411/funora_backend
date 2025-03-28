const express = require("express");
const router = express.Router();
const fileUploadController = require("../controllers/file_upload.controller");
const upload = require("../config/multer"); // Multer middleware for file uploads

router.post("/", upload.single("file"), fileUploadController.uploadFile);

module.exports = router;
