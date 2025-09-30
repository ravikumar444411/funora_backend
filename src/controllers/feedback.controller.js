// feedbackController.js
const Feedback = require("../models/feedback.model");
const { sendResponse } = require("../utils/responseFormatter");
const { uploadToS3 } = require("../utils/s3Upload"); // your S3 upload helper

exports.submitFeedback = async (req, res) => {
    try {
        const { name, mobile, feedback } = req.body;

        // Basic validation
        if (!name || !mobile || !feedback) {
            return sendResponse(res, false, [], "Name, mobile and feedback are required", 400);
        }

        let filesArray = [];

        // ✅ Handle optional files
        if (req.files && req.files.length > 0) {
            filesArray = await Promise.all(
                req.files.map(async (file) => {
                    const fileUrl = await uploadToS3({
                        buffer: file.buffer,
                        mimetype: file.mimetype,
                        originalname: file.originalname,
                    });

                    return {
                        filename: file.originalname,
                        url: fileUrl,
                    };
                })
            );
        }

        // ✅ Save feedback to DB
        const newFeedback = new Feedback({
            name,
            mobile,
            feedback,
            files: filesArray, // optional
            isActive: true,
        });

        await newFeedback.save();

        return sendResponse(res, true, newFeedback, "Feedback submitted successfully", 200);
    } catch (error) {
        console.error("Submit Feedback Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};
