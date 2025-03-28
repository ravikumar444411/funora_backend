const mongoose = require("mongoose");

const AttendeeSchema = new mongoose.Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true  // Ensures a user can only set their attendance status once per event
        },
        status: {
            type: String,
            enum: ["going", "interested", "not going"],
            required: true
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Attendee", AttendeeSchema);
