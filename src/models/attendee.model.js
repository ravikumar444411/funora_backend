const mongoose = require("mongoose");

const AttendeeSchema = new mongoose.Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["going", "interested", "not going"],
            required: true,
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// ✅ This enforces uniqueness of the (eventId, userId) pair
AttendeeSchema.index({ eventId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Attendee", AttendeeSchema);
