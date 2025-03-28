const Organizer = require("../models/organizer.model");
const bcrypt = require("bcryptjs");
const { sendResponse, formatOrganizerResponse } = require("../utils/responseFormatter");

// Email and phone validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10}$/;

// 🔹 POST: Create a New Organizer
exports.createOrganizer = async (req, res) => {
    try {
        const { name, email, phone, profilePicture, description, website, socialLinks, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return sendResponse(res, false, [], "Name, email, and password are required", 400);
        }

        // Validate email format
        if (!emailRegex.test(email)) {
            return sendResponse(res, false, [], "Invalid email format", 400);
        }

        // Validate phone format if provided
        if (phone && !phoneRegex.test(phone)) {
            return sendResponse(res, false, [], "Invalid phone number format", 400);
        }

        // Check if organizer email already exists
        const organizerExists = await Organizer.findOne({ email });
        if (organizerExists) {
            return sendResponse(res, false, [], "Organizer already exists", 400);
        }

        // Hash Password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const newOrganizer = new Organizer({
            name,
            email,
            phone,
            profilePicture,
            description,
            website,
            socialLinks,
            password: hashedPassword,
            verified: false // New organizers are unverified by default
        });

        await newOrganizer.save();
        return sendResponse(res, true, newOrganizer, "Organizer created successfully", 201);
    } catch (error) {
        console.error("Create Organizer Error:", error);
        return sendResponse(res, false, [], "Server Error", 500);
    }
};


// 🔹 PUT: Update an Organizer
exports.updateOrganizer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, profilePicture, description, website, socialLinks } = req.body;

        // Find organizer by ID
        let organizer = await Organizer.findById(id);
        if (!organizer) {
            return sendResponse(res, false, [], "Organizer not found", 404);
        }

        // Update fields if provided
        organizer.name = name || organizer.name;
        organizer.phone = phone || organizer.phone;
        organizer.profilePicture = profilePicture || organizer.profilePicture;
        organizer.description = description || organizer.description;
        organizer.website = website || organizer.website;
        organizer.socialLinks = socialLinks || organizer.socialLinks;

        // Save updates
        await organizer.save();
        return sendResponse(res, true, organizer, "Organizer updated successfully", 200);
    } catch (error) {
        console.error("Update Organizer Error:", error);
        return sendResponse(res, false, [], "Server Error", 500);
    }
};

// 🔹 GET: Fetch All Active Organizers
exports.getAllOrganizers = async (req, res) => {
    try {
        const organizers = await Organizer.find({ status: "active" });
        const formattedResponse = organizers.map(formatOrganizerResponse);

        return sendResponse(res, true, formattedResponse, "Active organizers fetched successfully", 200);
    } catch (error) {
        console.error("Get All Organizers Error:", error);
        return sendResponse(res, false, [], "Server Error", 500);
    }
};

// 🔹 GET: Fetch Active Organizer by ID
exports.getOrganizerById = async (req, res) => {
    try {
        const { id } = req.params;
        const organizer = await Organizer.findOne({ _id: id, status: "active" });

        if (!organizer) {
            return sendResponse(res, false, [], "Active organizer not found", 404);
        }

        return sendResponse(res, true, formatOrganizerResponse(organizer), "Active organizer details fetched successfully", 200);
    } catch (error) {
        console.error("Get Organizer By ID Error:", error);
        return sendResponse(res, false, [], "Server Error", 500);
    }
};

