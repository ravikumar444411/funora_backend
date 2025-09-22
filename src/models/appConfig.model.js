const mongoose = require("mongoose");

const AppConfigSchema = new mongoose.Schema(
    {
        enable_reminder_notification: { type: Boolean, default: true },
        enable_new_event_notification: { type: Boolean, default: true },
        enable_event_update_notification: { type: Boolean, default: true },
        isActive: { type: Boolean, default: true }, // general flag to enable/disable config
    },
    { timestamps: true }
);

module.exports = mongoose.model("AppConfig", AppConfigSchema);
