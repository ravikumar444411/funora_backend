const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    eventTitle: { type: String, required: true },
    eventDescription: { type: String },
    eventCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "Organizers", required: true }, // Reference to Organizers table
    eventDateFrom: { type: Date, required: true },
    eventDateTo: { type: Date, required: true },
    eventTimeFrom: { type: String },
    eventTimeTo: { type: String },
    eventDuration: { type: String },
    eventVenue: { type: String, required: true },
    isPublic: { type: Boolean, default: true },
    media: { type: [String] },
    ticketPrice: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
