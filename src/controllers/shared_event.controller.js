const SharedEvent = require("../models/shared_event.model"); // Import the model
const { formatEventResponse, sendResponse } = require("../utils/responseFormatter");


exports.shareEvent = async (req, res) => {
    try {
        const { eventId, userId, sharedVia } = req.body;

        if (!eventId || !userId || !sharedVia) {
            return sendResponse(res, false, [], "Missing required fields", 400);
        }

        const newSharedEvent = new SharedEvent({ eventId, userId, sharedVia });
        await newSharedEvent.save();

        return sendResponse(res, true, newSharedEvent, "Event shared successfully", 201);
    } catch (error) {
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};


exports.getSharedEventByEventId = async (req, res) => {
    try {
        const { eventId } = req.params;

        const sharedEvents = await SharedEvent.find({ eventId }).populate("userId", "name email");

        if (!sharedEvents.length) {
            return sendResponse(res, false, [], "No shared event found for this event ID", 404);
        }

        return sendResponse(res, true, sharedEvents, "Shared event details fetched successfully", 200);
    } catch (error) {
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};


exports.getSharedEventByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        const sharedEvents = await SharedEvent.find({ userId }); // .populate("eventId");

        if (!sharedEvents.length) {
            return sendResponse(res, false, [], "No shared events found for this user ID", 404);
        }

        return sendResponse(res, true, sharedEvents, "Shared events fetched successfully", 200);
    } catch (error) {
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

