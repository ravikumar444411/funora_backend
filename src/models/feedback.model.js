const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        mobile: {
            type: String,
            required: true,
            trim: true,
        },
        feedback: {
            type: String,
            required: true,
            trim: true,
        },
        files: [
            {
                filename: { type: String },
                url: { type: String },
            }
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Optional index to query active feedback quickly
FeedbackSchema.index({ isActive: 1 });

module.exports = mongoose.model("Feedback", FeedbackSchema);
