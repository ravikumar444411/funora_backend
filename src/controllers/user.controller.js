const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const { formatUserResponse, sendResponse } = require("../utils/responseFormatter");


// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (supports various formats)
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// 🔹 POST: Create a New User
exports.createUser = async (req, res) => {
    try {
        const { fullName, email, profilePicture, password, phone, dob, location } = req.body;

        // Validate required fields
        if (!fullName || !email || !password) {
            return sendResponse(res, false, [], "Full name, email, and password are required", 400);
        }

        // Validate email format
        if (!emailRegex.test(email)) {
            return sendResponse(res, false, [], "Invalid email format", 400);
        }

        // Validate phone format if provided
        if (phone && !phoneRegex.test(phone)) {
            return sendResponse(res, false, [], "Invalid phone number format", 400);
        }

        // Check if email already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return sendResponse(res, false, [], "User already exists", 400);
        }

        // Hash Password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullName,
            email,
            profilePicture,
            password: hashedPassword,
            phone,
            dob,
            location
        });

        await newUser.save();
        return sendResponse(res, true, newUser, "User created successfully", 201);
    } catch (error) {
        console.error("Create User Error:", error);
        return sendResponse(res, false, [], "Server Error", 500);
    }
};


// 🔹 GET: Fetch All Active Users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ status: "active" }).select("-password"); // Fetch only active users
        const formattedUsers = users.map(formatUserResponse);
        return sendResponse(res, true, formattedUsers, "Users fetched successfully", 200);
    } catch (error) {
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

// 🔹 GET: Fetch Single Active User by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, status: "active" }).select("-password");

        if (!user) return sendResponse(res, false, [], "User not found or inactive", 404);

        const formattedUser = formatUserResponse(user);
        return sendResponse(res, true, formattedUser, "User fetched successfully", 200);
    } catch (error) {
        return sendResponse(res, false, [], "Error fetching user", 500);
    }
};


// 🔹 PUT: Update User
exports.updateUser = async (req, res) => {
    try {
        const allowedFields = [
            "fullName",
            "phone",
            "email",
            "profilePicture",
            "dob",
            "location"
        ];

        const updates = {};

        // Validate and filter fields before updating
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                if (field === "email" && !emailRegex.test(req.body.email)) {
                    return sendResponse(res, false, [], "Invalid email format", 400);
                }
                if (field === "phone" && !phoneRegex.test(req.body.phone)) {
                    return sendResponse(res, false, [], "Invalid phone number format", 400);
                }
                updates[field] = req.body[field];
            }
        }

        // Update user only if there are valid fields
        if (Object.keys(updates).length === 0) {
            return sendResponse(res, false, [], "No valid fields provided for update", 400);
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, { new: true });

        if (!updatedUser) {
            return sendResponse(res, false, [], "User not found", 404);
        }

        return sendResponse(res, true, updatedUser, "User updated successfully", 200);
    } catch (error) {
        console.error("Update error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

// 🔹 DELETE: Soft Delete User
exports.deleteUser = async (req, res) => {
    try {
        const { id: userId } = req.params;

        // Find and update the user to mark as inactive (soft delete)
        const deletedUser = await User.findByIdAndUpdate(
            userId,
            { status: "inactive" },
            { new: true } // Return the updated document
        );

        if (!deletedUser) {
            return sendResponse(res, false, [], "User not found", 404);
        }

        return sendResponse(res, true, deletedUser, "User deleted successfully", 200);
    } catch (error) {
        console.error("Delete User Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};



