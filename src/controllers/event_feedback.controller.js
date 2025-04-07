const EventFeedback = require("../models/event_feedback.model");
const Attendee = require("../models/attendee.model");
const User = require("../models/user.model");
const { formatFeedbackResponse, sendResponse } = require("../utils/responseFormatter");

// 🔹 Post a Comment on Event
exports.postEventComment = async (req, res) => {
    try {
        const { eventId, userId, comment } = req.body;

        if (!eventId || !userId || !comment) {
            return res.status(400).json({
                success: false,
                message: "Event ID, User ID, and comment are required"
            });
        }

        // Create a new feedback comment
        const newFeedback = new EventFeedback({
            eventId,
            userId,
            comment
        });

        await newFeedback.save();

        return res.status(200).json({
            success: true,
            message: "Comment added successfully",
            data: formatFeedbackResponse(newFeedback)
        });
    } catch (error) {
        console.error("Error posting event comment:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};



// Utility function to format large numbers
const formatNumber = (num) => {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toString();
};

// 🔹 Get Event Attendee & Feedback Summary
exports.getEventSummary = async (req, res) => {
    try {
        const { eventId, userId } = req.body;

        if (!eventId) {
            return res.status(400).json({ success: false, message: "Event ID is required" });
        }

        // Count total active attendees
        const attendeeCount = await Attendee.countDocuments({ eventId, isActive: true });

        // Fetch top 4 active attendee profiles
        const topAttendees = await Attendee.find({ eventId, isActive: true })
            .limit(4)
            .populate("userId", "_id profilePicture fullName") // Fetch user profile URL & full name
            .lean();

        const attendeeProfiles = topAttendees.map((attendee) => attendee.userId.profilePicture);

        // Fetch top 4 active comments
        let comments = await EventFeedback.find({ eventId, isActive: true })
            .sort({ createdAt: -1 }) // Latest comments first
            .limit(4)
            .populate("userId", "_id profilePicture fullName") // Fetch user details
            .lean();

        // Check if the requesting user has commented, and move their comment to the top
        if (userId) {
            const userComment = comments.find((comment) => comment.userId._id.toString() === userId);
            if (userComment) {
                comments = [userComment, ...comments.filter((c) => c.userId._id.toString() !== userId)];
            }
        }

        // Format comments response
        const formattedComments = comments.map((comment) => ({
            profilePicture: comment.userId.profilePicture,
            fullName: comment.userId.fullName,
            comment: comment.comment
        }));

        return res.status(200).json({
            success: true,
            totalAttendees: formatNumber(attendeeCount),
            topAttendeeProfiles: attendeeProfiles.length ? attendeeProfiles : "No attendees yet",
            topComments: formattedComments.length ? formattedComments : "No comments yet"
        });
    } catch (error) {
        console.error("Error fetching event summary:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// fetch all comments by event ID
exports.getAllCommentsByEventId = async (req, res) => {
    try {
        const { eventId } = req.body;

        if (!eventId) {
            return sendResponse(res, false, [], "Event ID is required", 400);
        }

        const comments = await EventFeedback.find({ eventId, isActive: true })
            .sort({ createdAt: -1 }) // latest first
            .populate("userId", "fullName profilePicture")
            .lean();

        // filter out feedbacks where userId is null
        const formattedComments = comments
            .filter(feedback => feedback.userId) // skip if userId is null
            .map((feedback) => ({
                commentId: feedback._id,
                comment: feedback.comment,
                userId: feedback.userId._id,
                fullName: feedback.userId.fullName,
                profilePicture: feedback.userId.profilePicture,
                createdAt: feedback.createdAt
            }));

        return sendResponse(res, true, formattedComments, "Comments fetched successfully", 200);
    } catch (error) {
        console.error("Error fetching comments:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};
