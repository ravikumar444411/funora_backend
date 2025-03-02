const User = require("../models/user.model");
const bcrypt = require("bcryptjs");

// 🔹 POST: Create a New User
exports.createUser = async (req, res) => {
    try {
        const { fullName, email, password, phone } = req.body;

        // Check if email already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash Password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            phone
        });

        await newUser.save();
        res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 🔹 GET: Fetch All Users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password"); // Exclude password field
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
};

// 🔹 GET: Fetch Single User by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user", error: error.message });
    }
};

// 🔹 PUT: Update User
exports.updateUser = async (req, res) => {
    try {
        const { fullName, phone, location, preferences } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { fullName, phone, location, preferences },
            { new: true }
        );

        if (!updatedUser) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Error updating user", error: error.message });
    }
};