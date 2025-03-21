const mongoose = require("mongoose");

const preferenceSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        theme: { type: String, enum: ["light", "dark"], default: "light" },
        eventCategories: [{ type: String }], // Max 3 preferred event types
        locationPreference: { type: String }, // City name
        eventType: { type: String, enum: ["Online", "In-Person"], default: "In-Person" },
        budget: { type: String, enum: ["Free", "Paid"], default: "Free" },
        isActive: { type: Boolean, default: true } // Added isActive field
    },
    { timestamps: true }
);

module.exports = mongoose.model("Preference", preferenceSchema);
