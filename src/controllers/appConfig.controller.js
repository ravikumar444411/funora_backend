const AppConfig = require("../models/appConfig.model");
const { sendResponse } = require("../utils/responseFormatter");
exports.updateAppConfig = async (req, res) => {
    try {
        const {
            enable_reminder_notification,
            enable_new_event_notification,
            enable_event_update_notification,
        } = req.body;

        // Validate required fields
        if (
            enable_reminder_notification === undefined ||
            enable_new_event_notification === undefined ||
            enable_event_update_notification === undefined
        ) {
            return sendResponse(res, false, [], "All feature flags are required", 400);
        }

        // Try to find existing config
        let config = await AppConfig.findOne();

        if (config) {
            // Update existing document
            config.enable_reminder_notification = enable_reminder_notification;
            config.enable_new_event_notification = enable_new_event_notification;
            config.enable_event_update_notification = enable_event_update_notification;

            await config.save();
            return sendResponse(res, true, config, "AppConfig updated successfully", 200);
        } else {
            // Create new document
            const newConfig = new AppConfig({
                enable_reminder_notification,
                enable_new_event_notification,
                enable_event_update_notification,
            });

            await newConfig.save();
            return sendResponse(res, true, newConfig, "AppConfig created successfully", 201);
        }
    } catch (error) {
        console.log("Upsert AppConfig Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};
