const { sendResponse } = require("../utils/responseFormatter");
const uploadToS3 = require("../utils/s3Upload");

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return sendResponse(res, false, [], "No file uploaded", 400);
        }

        const fileUrl = await uploadToS3(req.file);

        return sendResponse(res, true, { fileUrl }, "File uploaded successfully", 200);
    } catch (error) {
        console.error("File Upload Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};
