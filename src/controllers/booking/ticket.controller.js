const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
const { sendResponse } = require("../../utils/responseFormatter");
// Generate QR Code API
exports.generateQRCode = async (req, res) => {
    try {
        const { text } = req.body;

        // Validate input
        if (!text || text.trim() === "") {
            return sendResponse(res, false, [], "Text is required to generate QR code", 400);
        }

        // Generate QR code as Data URL (base64 image)
        const qrCodeDataUrl = await QRCode.toDataURL(text);

        return sendResponse(res, true, { qrCode: qrCodeDataUrl }, "QR Code generated successfully", 200);
    } catch (error) {
        console.log("Generate QR Code Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};


// New method: Save QR as PNG file
exports.generateQRCodeFile = async (req, res) => {
    try {
        const { text } = req.body;

        // Validate input
        if (!text || text.trim() === "") {
            return sendResponse(res, false, [], "Text is required to generate QR code", 400);
        }

        // Define file name and path
        const fileName = `qr_${Date.now()}.png`;
        const filePath = path.join(__dirname, "../../../uploads/qrcodes", fileName);

        // Ensure folder exists
        fs.mkdirSync(path.dirname(filePath), { recursive: true });

        // Generate and save QR code as file
        await QRCode.toFile(filePath, text);

        // You can return file path or serve via static URL
        return sendResponse(
            res,
            true,
            { fileName, filePath, url: `/uploads/qrcodes/${fileName}` },
            "QR Code file generated successfully",
            200
        );
    } catch (error) {
        console.log("Generate QR Code File Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};
