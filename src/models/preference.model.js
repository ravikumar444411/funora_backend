const mongoose = require("mongoose");

const preferenceSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        eventCategories: [{ type: String }], // Max 3 preferred event types
        timeFrame: { type: String, enum: ["Today", "Weekend", "Weekday", "This Month", "Custom"], default: "Today" },
        fromDate: { type: Date }, // Required only when timeFrame is "Custom"
        toDate: { type: Date },   // Required only when timeFrame is "Custom"
        timeOfDay: { type: String, enum: ["Morning", "Afternoon", "Evening", "Night", "Custom"] },
        fromTime: { type: String }, // Required only when timeOfDay is "Custom"
        toTime: { type: String },   // Required only when timeOfDay is "Custom"
        locationPreference: { type: String }, // City name
        eventType: { type: String, enum: ["Online", "In-Person"], default: "In-Person" },
        budget: { type: String, enum: ["Free", "Paid"], default: "Free" },
        priceRange: {
            min: { type: Number, default: 0 },
            max: { type: Number, default: 1000 }
        },
        isActive: { type: Boolean, default: true } // Ensure isActive is always true
    },
    { timestamps: true }
);

module.exports = mongoose.model("Preference", preferenceSchema);
