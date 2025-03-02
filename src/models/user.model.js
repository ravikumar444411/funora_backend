const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        phone: { type: String },
        profilePicture: { type: String },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        lastLogin: { type: Date, default: Date.now },
        status: { type: String, enum: ["active", "inactive", "banned"], default: "active" },
        location: {
            city: String,
            country: String
        },
        preferences: {
            theme: { type: String, default: "light" },
            language: { type: String, default: "en" }
        }
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
