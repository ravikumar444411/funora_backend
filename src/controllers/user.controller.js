const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const Notification = require('../models/notification.model');
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
        const { userId } = req.body;

        const user = await User.findOne({ _id: userId, status: "active" }).select("-password");
        if (!user) {
            return sendResponse(res, false, [], "User not found or inactive", 404);
        }

        // Count total notifications for the user
        const totalNotifications = await Notification.countDocuments({ userId,isRead:false });

        const formattedUser = 
        formatUserResponse(user);

        // Extract first name safely
        const fullName = user.fullName || '';
        const firstName = fullName.split(' ')[0] || '';

        // Set placeholders
        const email = user.email && user.email.trim() !== '' ? user.email : 'user@example.com';
        const profilePicture = user.profilePicture && user.profilePicture.trim() !== '' ? user.profilePicture : 'https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg';
        const dob = user.dob ? user.dob : new Date('1990-01-01');
        const location = user.location && user.location.trim() !== '' ? user.location : 'Not specified';

        const responseData = {
            ...formattedUser,
            totalNotifications,
            firstName,
            email,
            profilePicture,
            dob,
            location
        };

        return sendResponse(res, true, responseData, "User fetched successfully", 200);
    } catch (error) {
        console.error("Error fetching user:", error);
        return sendResponse(res, false, [], "Error fetching user", 500);
    }
};





// 🔹 PUT: Update User
exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.body;
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

        const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });

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



