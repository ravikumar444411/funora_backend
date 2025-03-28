const Preference = require("../models/preference.model");
const { formatPreferencesResponse, sendResponse } = require("../utils/responseFormatter");

// 🔹 Create or Update Preferences
exports.upsertPreferences = async (req, res) => {
    try {
        const {
            userId, eventCategories, priceRange, timeFrame, fromDate, toDate,
            timeOfDay, fromTime, toTime, eventType, budget, locationPreference
        } = req.body;
        let updateData = { ...req.body, isActive: true }; // Ensure isActive is always true

        // Ensure userId is present
        if (!userId) {
            return sendResponse(res, false, [], "User ID is required", 400);
        }

        // Limit eventCategories to a maximum of 3
        if (eventCategories && eventCategories.length > 3) {
            return sendResponse(res, false, [], "You can select a maximum of 3 event categories", 400);
        }

        // Validate price range
        if (priceRange) {
            const { min, max } = priceRange;
            if (min > max) {
                return sendResponse(res, false, [], "Invalid price range: min price cannot be greater than max price", 400);
            }
        }

        // Validate timeFrame
        const validTimeFrames = ["Today", "Weekend", "Weekday", "This Month", "Custom"];
        if (timeFrame && !validTimeFrames.includes(timeFrame)) {
            return sendResponse(res, false, [], "Invalid time frame selected", 400);
        }

        // If Custom timeFrame is selected, validate fromDate & toDate
        if (timeFrame === "Custom") {
            if (!fromDate || !toDate) {
                return sendResponse(res, false, [], "Both fromDate and toDate are required for Custom time frame", 400);
            }
            if (new Date(fromDate) > new Date(toDate)) {
                return sendResponse(res, false, [], "fromDate cannot be after toDate", 400);
            }
        } else {
            updateData.fromDate = null;
            updateData.toDate = null;
        }

        // Validate timeOfDay (should be an array with valid options)
        const validTimeOfDayOptions = ["Morning", "Afternoon", "Evening", "Night", "Custom"];
        if (timeOfDay && !validTimeOfDayOptions.includes(timeOfDay)) {
            return sendResponse(res, false, [], "Invalid time of day selection", 400);
        }

        // If Custom timeOfDay is selected, validate fromTime & toTime
        if (timeOfDay === "Custom") {
            if (!fromTime || !toTime) {
                return sendResponse(res, false, [], "Both fromTime and toTime are required for Custom time of day", 400);
            }
            if (fromTime >= toTime) {
                return sendResponse(res, false, [], "fromTime cannot be greater than or equal to toTime", 400);
            }
        } else {
            updateData.fromTime = null;
            updateData.toTime = null;
        }

        // Validate eventType
        const validEventTypes = ["Online", "In-Person"];
        if (eventType && !validEventTypes.includes(eventType)) {
            return sendResponse(res, false, [], "Invalid event type", 400);
        }

        // Validate budget
        const validBudgets = ["Free", "Paid"];
        if (budget && !validBudgets.includes(budget)) {
            return sendResponse(res, false, [], "Invalid budget type", 400);
        }

        // Ensure locationPreference is a string
        if (locationPreference && typeof locationPreference !== "string") {
            return sendResponse(res, false, [], "Location preference must be a string", 400);
        }

        // Find existing preferences, update if found, otherwise create new
        const preference = await Preference.findOneAndUpdate(
            { userId },
            updateData,
            { new: true, upsert: true, runValidators: true }
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
