const Attendee = require("../models/attendee.model");
const { formatAttendeeResponse, sendResponse } = require("../utils/responseFormatter");

// 🔹 Create or Update Attendee Status
exports.createAttendee = async (req, res) => {
    try {
        const { eventId, userId, status } = req.body;

        if (!eventId || !userId || !status) {
            return sendResponse(res, false, [], "Event ID, User ID, and Status are required", 400);
        }

        // Check if the user has already responded to this event
        let attendee = await Attendee.findOne({ eventId, userId });

        if (attendee) {
            // Update existing status
            attendee.status = status;
            await attendee.save();
            return sendResponse(res, true, attendee, "Attendance status updated successfully", 200);
        } else {
            // Create new attendance entry
            const newAttendee = new Attendee({ eventId, userId, status });
            await newAttendee.save();
            return sendResponse(res, true, newAttendee, "Attendance status recorded successfully", 200);
        }
    } catch (error) {
        console.log("Create Attendee Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

// Get Attendee Status by Event ID & User ID
exports.getAttendeeStatus = async (req, res) => {
    try {
        const { eventId, userId } = req.body;

        // Find the attendee record
        const attendee = await Attendee.findOne({ eventId, userId });

        if (!attendee) {
            return res.status(404).json({ success: false, message: "Attendee record not found" });
        }

        return res.status(200).json({
            success: true,
            data: formatAttendeeResponse(attendee)
        });
    } catch (error) {
        console.error("Error fetching attendee status:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

