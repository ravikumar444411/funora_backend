const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        phone: { type: String },
        profilePicture: { type: String },
        dob: { type: Date },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        lastLogin: { type: Date, default: Date.now },
        status: { type: String, enum: ["active", "inactive", "banned"], default: "active" },
        location: {
            city: { type: String }
        },
        preferences: {
            theme: { type: String, default: "light" },
            language: { type: String, default: "en" }
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
