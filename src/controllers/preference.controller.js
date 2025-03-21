const Preference = require("../models/preference.model");
const { formatPreferencesResponse, sendResponse } = require("../utils/responseFormatter");

// 🔹 Create or Update Preferences
exports.upsertPreferences = async (req, res) => {
    try {
        const { userId } = req.body;
        const updateData = { ...req.body, isActive: true }; // Ensure isActive is always true on update

        // Ensure userId is present
        if (!userId) {
            return sendResponse(res, false, [], "User ID is required", 400);
        }

        // Find existing preferences, update if found, otherwise create new
        const preference = await Preference.findOneAndUpdate(
            { userId },
            updateData,
            { new: true, upsert: true }
        );

        return sendResponse(res, true, formatPreferencesResponse(preference), "Preferences saved successfully", 200);
    } catch (error) {
        console.error("Error updating preferences:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

// 🔹 Get Preferences by User ID (Only Active Preferences)
exports.getPreferencesByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const preference = await Preference.findOne({ userId, isActive: true });

        if (!preference) {
            return sendResponse(res, false, [], "Active preferences not found", 404);
        }

        return sendResponse(res, true, formatPreferencesResponse(preference));
    } catch (error) {
        console.error("Error fetching preferences:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

// 🔹 Soft Delete Preferences by User ID (Set isActive to false)
exports.deletePreferences = async (req, res) => {
    try {
        const { userId } = req.params;
        const deletedPreference = await Preference.findOneAndUpdate(
            { userId, isActive: true },
            { isActive: false },
            { new: true }
        );

        if (!deletedPreference) {
            return sendResponse(res, false, [], "Active preferences not found", 404);
        }

        return sendResponse(res, true, [], "Preferences deleted successfully", 200);
    } catch (error) {
        console.error("Error deleting preferences:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};
