const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // assumes you have a User model
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["manual", "gps", "none"],
            default: "none",
        },
        manualLocation: {
            name: { type: String }, // e.g., "Connaught Place, Delhi"
            coordinates: {
                lat: { type: Number },
                lng: { type: Number },
            },
        },
        gpsLocation: {
            lat: { type: Number },
            lng: { type: Number },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Location", locationSchema);
