const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const { sendResponse } = require("../utils/responseFormatter");
const { generateToken, verifyToken, verifyAndDecodeToken } = require("../utils/tokenService");


exports.checkUser = async (req, res) => {
    try {
        const { phone, email } = req.body;
        let resData = { phone, email };

        // Validate input
        if (!phone && !email) {
            return sendResponse(res, false, [], "Phone or Email required", 400);
        }

        // Build dynamic query only if value exists
        const query = [];
        if (phone) query.push({ phone });
        if (email) query.push({ email });

        const user = await User.findOne({ $or: query });

        if (!user) {
            resData.isRegistered = false;
            return sendResponse(res, true, resData, "User not registered", 200);
        }

        // User found
        resData.isRegistered = true;
        resData.user = {
            id: user._id,
            fullName: user.fullName,
            phone: user.phone,
            email: user.email,
            role: user.role,
            status: user.status,
        };

        resData.token = await generateToken(user);

        return sendResponse(res, true, resData, "User already registered", 200);

    } catch (error) {
        console.error("Check user error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

exports.completeUserProfile = async (req, res) => {
    try {
        const { phone, fullName, dob, email } = req.body;

        console.log("req body completeUserProfile ====> ", req.body)
        // Validate input
        if (!phone || !fullName || !dob || !email) {
            return res.status(400).json({
                success: false,
                message: "Phone, full name, date of birth, and email are required",
            });
        }

        // Check if user exists by phone or email
        const query = [];
        if (phone) query.push({ phone });
        if (email) query.push({ email });

        let user = await User.findOne({ $or: query });
        const defaultPassword = await bcrypt.hash("Funora@123", 10);

        if (user) {
            // Update existing user
            user.fullName = fullName;
            user.password = defaultPassword,
                user.email = email;
            user.dob = new Date(dob);
            user.signup = true;
            await user.save();

            // Generate token
            const token = await generateToken(user);

            return res.status(200).json({
                success: true,
                message: "User profile updated successfully",
                userId: user._id,
                token
            });
        } else {
            // Create new user
            user = new User({
                phone,
                fullName,
                email,
                dob: new Date(dob),
                password: defaultPassword,
                signup: true
            });

            await user.save();

            // Generate token
            const token = await generateToken(user);

            return res.status(201).json({
                success: true,
                message: "User profile created successfully",
                userId: user._id,
                token
            });
        }
    } catch (error) {
        console.error("Error updating/creating user profile:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
