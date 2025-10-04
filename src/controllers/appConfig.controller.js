const AppConfig = require("../models/appConfig.model");
const { sendResponse } = require("../utils/responseFormatter");


exports.updateAppConfig = async (req, res) => {
    try {
        const {
            enable_reminder_notification,
            enable_new_event_notification,
            enable_event_update_notification,
            enable_payment_feature,
            test_users,
        } = req.body;

        // ✅ Validate required fields
        if (
            enable_reminder_notification === undefined ||
            enable_new_event_notification === undefined ||
            enable_event_update_notification === undefined ||
            enable_payment_feature === undefined
        ) {
            return sendResponse(res, false, [], "All feature flags are required", 400);
        }

        // ✅ Normalize test user list and add +91 if missing
        let normalizedTestUsers = [];
        if (Array.isArray(test_users)) {
            normalizedTestUsers = test_users.map((user) => {
                // If it's a 10-digit number, prefix +91
                if (/^\d{10}$/.test(user)) return `+91${user}`;
                return user;
            });
        }

        // ✅ Fetch existing config
        let config = await AppConfig.findOne();

        if (config) {
            // Update existing document
            config.enable_reminder_notification = enable_reminder_notification;
            config.enable_new_event_notification = enable_new_event_notification;
            config.enable_event_update_notification = enable_event_update_notification;
            config.enable_payment_feature = enable_payment_feature;
            config.test_users = normalizedTestUsers;

            await config.save();
            return sendResponse(res, true, config, "AppConfig updated successfully", 200);
        } else {
            // Create new config if none exists
            const newConfig = new AppConfig({
                enable_reminder_notification,
                enable_new_event_notification,
                enable_event_update_notification,
                enable_payment_feature,
                test_users: normalizedTestUsers,
            });

            await newConfig.save();
            return sendResponse(res, true, newConfig, "AppConfig created successfully", 201);
        }
    } catch (error) {
        console.error("Upsert AppConfig Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

