const Attendee = require("../models/attendee.model");
const { formatAttendeeResponse, sendResponse } = require("../utils/responseFormatter");

// 🔹 Create or Update Attendee Status
exports.createAttendee = async (req, res) => {
    try {
        const { eventId, userId } = req.body;

        if (!eventId || !userId) {
            return sendResponse(res, false, [], "Event ID and User ID are required", 400);
        }

        // Find existing attendee
        let attendee = await Attendee.findOne({ eventId, userId });

        let newStatus = "interested"; // default if no record

        if (attendee) {
            // Toggle status
            newStatus = attendee.status === "interested" ? "not going" : "interested";
        }

        // Upsert with new status
        attendee = await Attendee.findOneAndUpdate(
            { eventId, userId },
            { status: newStatus, isActive: true },
            { new: true, upsert: true } // ✅ create if not exists, return updated
        );

        return sendResponse(res, true, attendee, "Attendance status updated successfully", 200);
    } catch (error) {
        console.error("Error in createAttendee:", error);
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

