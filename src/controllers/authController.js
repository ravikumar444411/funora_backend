const admin = require("../config/firebaseAdmin");
const { sendResponse } = require("../utils/responseFormatter");

exports.sendOTP = async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    try {
        const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
        console.log("show user record ====", userRecord)
        return res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        if (error.code === "auth/user-not-found") {
            // If user doesn't exist, create one
            const userRecord = await admin.auth().createUser({ phoneNumber });
            return res.json({ success: true, message: "User created, OTP sent" });
        }
        return res.status(500).json({ success: false, message: "Error sending OTP", error });
    }
};



exports.verifyOTP = async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ success: false, message: "OTP token is required" });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return res.json({ success: true, message: "OTP Verified", user: decodedToken });
    } catch (error) {
        return res.status(400).json({ success: false, message: "Invalid OTP", error });
    }
};


exports.registerUser = async (req, res) => {
    try {
        const { email, password, fullName } = req.body;

        if (!email || !password) {
            return sendResponse(res, false, [], "Email and password are required", 400);
        }

        // Create user in Firebase Authentication
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: fullName,
        });

        return sendResponse(res, true, { uid: userRecord.uid, email: userRecord.email }, "User registered successfully", 201);
    } catch (error) {
        return sendResponse(res, false, [], error.message, 500);
    }
};


exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendResponse(res, false, [], "Email and password are required", 400);
        }

        // Firebase does NOT support direct password verification in Admin SDK.
        // Instead, generate a custom token and verify it on the frontend.
        const user = await admin.auth().getUserByEmail(email);

        const token = await admin.auth().createCustomToken(user.uid);

        return sendResponse(res, true, { token }, "Login successful", 200);
    } catch (error) {
        return sendResponse(res, false, [], error.message, 500);
    }
};

exports.getUser = async (req, res) => {
    try {
        const { uid } = req.params;

        const userRecord = await admin.auth().getUser(uid);

        return sendResponse(res, true, userRecord, "User retrieved successfully", 200);
    } catch (error) {
        return sendResponse(res, false, [], error.message, 500);
    }
};


exports.deleteUser = async (req, res) => {
    try {
        const { uid } = req.params;

        await admin.auth().deleteUser(uid);

        return sendResponse(res, true, [], "User deleted successfully", 200);
    } catch (error) {
        return sendResponse(res, false, [], error.message, 500);
    }
};

