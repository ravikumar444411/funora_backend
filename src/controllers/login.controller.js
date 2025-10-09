const bcrypt = require("bcryptjs");
const dayjs = require("dayjs");
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
        console.log("req body completeUserProfile ====> ", req.body);

        if (!phone || !fullName || !dob || !email) {
            return sendResponse(res, false, [], "Phone, full name, date of birth, and email are required", 400);
        }

        const formattedDob = dayjs(dob, "DD-MM-YYYY", true);
        if (!formattedDob.isValid()) {
            return sendResponse(res, false, [], "Invalid date format. Use DD-MM-YYYY.", 400);
        }

        const dobValue = formattedDob.toDate();
        const defaultPassword = await bcrypt.hash("Funora@123", 10);

        const query = [];
        if (phone) query.push({ phone });
        if (email) query.push({ email });

        let user = await User.findOne({ $or: query });

        if (user) {
            user.fullName = fullName;
            user.email = email;
            user.dob = dobValue;
            user.signup = true;
            if (!user.password) {
                user.password = defaultPassword;
            }
            await user.save();

            const token = await generateToken(user);
            return sendResponse(res, true, { userId: user._id, token }, "User profile updated successfully", 200);
        } else {
            user = new User({
                phone,
                fullName,
                email,
                dob: dobValue,
                password: defaultPassword,
                signup: true
            });

            await user.save();
            const token = await generateToken(user);

            return sendResponse(res, true, { userId: user._id, token }, "User profile created successfully", 201);
        }
    } catch (error) {
        console.error("Error updating/creating user profile:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

