const mongoose = require("mongoose");

const EventSuggestionSchema = new mongoose.Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        suggestion: {
            type: String,
            trim: true
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("event_suggestion", EventSuggestionSchema);
