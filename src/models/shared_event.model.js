const mongoose = require("mongoose");

const sharedEventSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sharedVia: {
        type: String,
        enum: ["whatsapp", "facebook", "twitter", "instagram", "linkedin", "email", "sms", "other"],
        required: true
    },
    sharedAt: { type: Date, default: Date.now }
});

const SharedEvent = mongoose.model("shared_event", sharedEventSchema);
module.exports = SharedEvent;
