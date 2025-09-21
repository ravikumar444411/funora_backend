const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
    {
        eventTitle: { type: String, required: true },
        eventDescription: { type: String },
        eventCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
        organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "Organizers", required: true },
        eventDateFrom: { type: Date, required: true },
        eventDateTo: { type: Date, required: true },
        eventTimeFrom: { type: String, match: /^([01]\d|2[0-3]):([0-5]\d)$/ }, // HH:mm
        eventTimeTo: { type: String, match: /^([01]\d|2[0-3]):([0-5]\d)$/ },   // HH:mm
        eventDuration: { type: String },
        eventVenue: { type: String, required: true },
        isPublic: { type: Boolean, default: true },

        // 🔹 Main Image with variants
        mainImage: {
            square: { type: String },
            rectangle: { type: String },
            thumbnail: { type: String },
        },

        // 🔹 Extra images (media gallery)
        media: { type: [String] },

        ticketPrice: { type: Number, default: 0 },
        eventGuidance: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);
module.exports = Event;
