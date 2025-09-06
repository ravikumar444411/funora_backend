const mongoose = require("mongoose");

const userNotificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        notificationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MasterNotification",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "sent", "failed", "read"],
            default: "pending",
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
        },
        metadata: {
            type: Object,
            default: {},
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt
    }
);

module.exports = mongoose.model("UserNotification", userNotificationSchema);
