const mongoose = require("mongoose");

const AppConfigSchema = new mongoose.Schema(
    {
        enable_reminder_notification: { type: Boolean, default: true },
        enable_new_event_notification: { type: Boolean, default: true },
        enable_event_update_notification: { type: Boolean, default: true },
        enable_payment_feature: { type: Boolean, default: true },
        test_users: [{ type: String }],
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("AppConfig", AppConfigSchema);
