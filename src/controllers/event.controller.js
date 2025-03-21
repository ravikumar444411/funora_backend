const Event = require('../models/event.model');
const { formatEventResponse, sendResponse } = require("../utils/responseFormatter");
const uploadToS3 = require("../utils/s3Upload");

// Create Event
exports.createEvent = async (req, res) => {
    try {
        const { eventTitle, eventDescription, eventCategory, eventDateFrom, eventDateTo, eventTimeFrom, eventTimeTo, eventDuration, eventVenue, isPublic } = req.body;

        // Upload files to S3 (if any)
        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = await Promise.all(req.files.map(file => uploadToS3(file)));
        }

        // Create new event
        const newEvent = new Event({
            eventTitle,
            eventDescription,
            eventCategory,
            eventDateFrom,
            eventDateTo,
            eventTimeFrom,
            eventTimeTo,
            eventDuration,
            eventVenue,
            isPublic: isPublic === "true",
            media: imageUrls,
            isActive: true
        });

        await newEvent.save();
        return sendResponse(res, true, newEvent, "Event created successfully", 200);
    } catch (error) {
        console.log("this is error", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

// Get All Events
exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find({ isActive: true });
        const formattedEvents = events.map(formatEventResponse);
        return sendResponse(res, true, formattedEvents);
    } catch (error) {
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

// Get Single Event by ID
exports.getEventById = async (req, res) => {
    try {
        // const event = await Event.findById(req.params.id);
        const event = await Event.findOne({ _id: req.params.id, isActive: true });
        if (!event) return sendResponse(res, false, [], "Event not found", 400);
        const formattedEvent = formatEventResponse(event);
        return sendResponse(res, true, formattedEvent);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const updateFields = {};

        // Extract fields from request body
        const allowedFields = [
            "eventTitle",
            "eventDescription",
            "eventCategory",
            "eventDateFrom",
            "eventDateTo",
            "eventTimeFrom",
            "eventTimeTo",
            "eventDuration",
            "eventVenue",
            "isPublic"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updateFields[field] = req.body[field];
            }
        });

        // Handle isPublic conversion
        if (req.body.isPublic !== undefined) {
            updateFields.isPublic = req.body.isPublic === "true";
        }

        // Upload new files if provided
        if (req.files && req.files.length > 0) {
            const uploadedImages = await Promise.all(req.files.map(file => uploadToS3(file)));
            updateFields.media = uploadedImages;
        }

        // Find and update the event
        const updatedEvent = await Event.findByIdAndUpdate(eventId, updateFields, { new: true });

        if (!updatedEvent) {
            return sendResponse(res, false, [], "Event not found", 404);
        }

        return sendResponse(res, true, updatedEvent, "Event updated successfully", 200);
    } catch (error) {
        console.log("this is error", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

// Delete Event
exports.deleteEvent = async (req, res) => {
    try {
        const { id: eventId } = req.params;

        // Find and update the event to mark it as inactive
        const deletedEvent = await Event.findByIdAndUpdate(
            eventId,
            { isActive: false },
            { new: true } // Return the updated document
        );

        if (!deletedEvent) {
            return sendResponse(res, false, [], "Event not found", 404);
        }

        return sendResponse(res, true, deletedEvent, "Event deleted successfully", 200);
    } catch (error) {
        console.log("this is error", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};
