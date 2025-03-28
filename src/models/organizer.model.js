const mongoose = require("mongoose");

const organizerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true }, // Organizer name
        email: { type: String, required: true, unique: true }, // Contact email
        phone: { type: String }, // Contact phone number
        profilePicture: { type: String }, // Organizer logo or profile image
        description: { type: String }, // Brief about the organizer
        website: { type: String }, // Website URL
        socialLinks: {
            facebook: { type: String },
            twitter: { type: String },
            instagram: { type: String },
            linkedin: { type: String }
        },
        eventsHosted: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }], // References to events
        verified: { type: Boolean, default: false }, // Verification status
        status: { type: String, enum: ["active", "inactive"], default: "active" }, // Account status
    },
    { timestamps: true }
);

module.exports = mongoose.model("Organizer", organizerSchema);
