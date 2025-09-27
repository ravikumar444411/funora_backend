const Event = require('../models/event.model');
const Category = require("../models/category.model");
const FavoriteEvent = require("../models/favorite_event.model");
const SharedEvent = require("../models/shared_event.model");
const Organizer = require("../models/organizer.model");
const Attendee = require("../models/attendee.model");
const EventFeedback = require("../models/event_feedback.model");
const { formatEventResponse, sendResponse, formatPopularEventResponse, formatRecommendedEventResponse } = require("../utils/responseFormatter");
const uploadToS3 = require("../utils/s3Upload");
const sharp = require("sharp");
const { sendNotification } = require('../client/notificationClient');
const AppConfig = require("../models/appConfig.model");
const EventSuggestion = require("../models/event_suggestion.model");


exports.createEvent = async (req, res) => {
    try {
        const {
            eventTitle,
            eventDescription,
            eventCategory,
            eventDateFrom,
            eventDateTo,
            eventTimeFrom,
            eventTimeTo,
            eventDuration,
            eventVenue,
            isPublic,
            organizerId,
            eventGuidance,
            ticketPrice
        } = req.body;

        if (!organizerId) {
            return sendResponse(res, false, [], "Organizer ID is required", 400);
        }

        let mainImageVariants = {};
        let extraImages = [];

        // ✅ Handle mainImage (single)
        if (req.files && req.files.mainImage && req.files.mainImage[0]) {
            const file = req.files.mainImage[0];

            // Square
            const squareBuffer = await sharp(file.buffer)
                .resize(500, 500, { fit: "cover" })
                .toBuffer();

            // Rectangle
            const rectBuffer = await sharp(file.buffer)
                .resize(1280, 720, { fit: "cover" })
                .toBuffer();

            // Thumbnail
            const thumbBuffer = await sharp(file.buffer)
                .resize(200, 200, { fit: "cover" })
                .toBuffer();

            // Upload to S3
            const squareUrl = await uploadToS3({
                buffer: squareBuffer,
                mimetype: file.mimetype,
                originalname: `square_${file.originalname}`,
            });

            const rectUrl = await uploadToS3({
                buffer: rectBuffer,
                mimetype: file.mimetype,
                originalname: `rect_${file.originalname}`,
            });

            const thumbUrl = await uploadToS3({
                buffer: thumbBuffer,
                mimetype: file.mimetype,
                originalname: `thumb_${file.originalname}`,
            });

            mainImageVariants = {
                square: squareUrl,
                rectangle: rectUrl,
                thumbnail: thumbUrl,
            };
        }

        // ✅ Handle extra images (media)
        if (req.files && req.files.images && req.files.images.length > 0) {
            extraImages = await Promise.all(
                req.files.images.map((file) => uploadToS3(file))
            );
        }

        // ✅ Save to DB
        const newEvent = new Event({
            eventTitle,
            eventDescription,
            eventGuidance,
            eventCategory,
            eventDateFrom,
            eventDateTo,
            eventTimeFrom,
            eventTimeTo,
            eventDuration,
            eventVenue,
            isPublic: isPublic === "true",
            mainImage: mainImageVariants,
            media: extraImages,
            organizerId,
            ticketPrice,
            isActive: true,
        });

        await newEvent.save();

        // 🔹 Trigger notification
        const config = await AppConfig.findOne({ isActive: true });
        if (config.enable_reminder_notification) {
            const notificationText = `🎉 Just announced: ‘${newEvent.eventTitle}’ is coming soon! Don’t miss out—check it out now!`
            sendNotification("CREATE_EVENT_NOTIFICATION", newEvent._id.toString(), null, notificationText);
        }

        return sendResponse(res, true, newEvent, "Event created successfully", 200);
    } catch (error) {
        console.log("Create Event Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};


// 🔹 Get All Active Events
exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find({ isActive: true });
        const formattedEvents = events.map(formatEventResponse);
        return sendResponse(res, true, formattedEvents, "Active events fetched successfully", 200);
    } catch (error) {
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

// 🔹 Get Single Event by ID
exports.getEventById = async (req, res) => {
    try {
        const { eventId, userId } = req.body;

        const event = await Event.findOne({ _id: eventId, isActive: true });

        if (!event) {
            return sendResponse(res, false, [], "Event not found", 404);
        }

        // Fetch category details
        const category = await Category.findById(event.eventCategory);
        const categoryType = category ? category.categoryType : "Unknown";

        // Fetch organizer details
        const organizer = await Organizer.findById(event.organizerId).select(
            "name email phone profilePicture description website socialLinks eventsHosted verified"
        );

        // Check if the event is marked as favorite by the user
        let isFavorite = false;
        let remindMe = false;
        if (userId) {
            const favoriteRecord = await FavoriteEvent.findOne({ eventId: eventId, userId, isActive: true });
            isFavorite = favoriteRecord ? favoriteRecord.isFavorite : false;
            remindMe = favoriteRecord ? favoriteRecord.remindMe : false;
        }

        let rateToEvent = false;
        const existingRating = await EventSuggestion.findOne({ eventId, userId });
        if (existingRating) {
            rateToEvent = true;
        }
        // Count attendees marked as "going"
        const goingAttendees = await Attendee.find({
            eventId,
            status: "going",
            isActive: true
        }).populate("userId", "profilePicture");

        // goingCount
        const goingCount = goingAttendees.length;

        // Format media
        const formattedMedia = event.media.map((url) => {
            const extension = url.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                return { type: "image", url };
            } else if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
                return { type: "video", url };
            }
            return { type: "unknown", url };
        });

        const videoMedia = formattedMedia.find((media) => media.type === "video");
        const videoUrl = videoMedia ? videoMedia.url : "";

        const imageMedia = formattedMedia.find((media) => media.type === "image");
        const bannerUrl = imageMedia ? imageMedia.url : "";

        // Fetch event feedbacks
        const feedbacks = await EventFeedback.find({ eventId, isActive: true })
            .sort({ createdAt: -1 })
            .populate("userId", "fullName profilePicture")
            .lean();

        let currentUserComment = [];
        const otherComments = [];
        const profilesPics = [
            ...new Set(goingAttendees.map(a => a.userId?.profilePicture).filter(Boolean))
        ];

        feedbacks.filter(feedback => feedback.userId).forEach((feedback) => {
            const formattedFeedback = {
                feedbackId: feedback._id,
                userId: feedback.userId._id,
                name: feedback.userId.fullName,
                profilePicture: feedback.userId.profilePicture,
                comment: feedback.comment
            };

            if (userId && String(feedback.userId._id) === String(userId)) {
                currentUserComment.push(formattedFeedback);
            } else if (otherComments.length < 4) {
                otherComments.push(formattedFeedback);
                // profilesPics.push(feedback.userId.profilePicture);
            }
        });

        const topComments = currentUserComment.length > 0
            ? [...currentUserComment, ...otherComments]
            : otherComments;


        const mainImage = {
            square: event.mainImage?.square || "",
            rectangle: event.mainImage?.rectangle || "",
            thumbnail: event.mainImage?.thumbnail || ""
        };


        // Format event response
        const formattedEvent = formatEventResponse(event);
        formattedEvent.categoryType = categoryType;
        formattedEvent.media = formattedMedia;
        formattedEvent.videoUrl = videoUrl;
        formattedEvent.bannerUrl = bannerUrl;
        formattedEvent.organizerId = organizer ? { ...organizer.toObject() } : null;
        formattedEvent.isFavorite = isFavorite;
        formattedEvent.remindMe = remindMe;
        formattedEvent.rateToEvent = rateToEvent;
        formattedEvent.goingCount = goingCount;
        formattedEvent.feedback = topComments;
        formattedEvent.profilePics = profilesPics;
        formattedEvent.mainImage = mainImage;

        return sendResponse(res, true, formattedEvent, "Event details fetched successfully", 200);
    } catch (error) {
        console.error("Error fetching event details:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};




// 🔹 Update Event
exports.updateEvent = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const updateFields = {};

        // Extract fields from request body
        const allowedFields = [
            "eventTitle", "eventDescription", "eventCategory", "eventDateFrom",
            "eventDateTo", "eventTimeFrom", "eventTimeTo", "eventDuration",
            "eventVenue", "isPublic", "organizerId", "eventGuidance", "ticketPrice"
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) updateFields[field] = req.body[field];
        });

        if (req.body.isPublic !== undefined) {
            updateFields.isPublic = req.body.isPublic === "true";
        }

        // Upload files if provided
        if (req.files && req.files.length > 0) {
            const uploadedImages = await Promise.all(req.files.map(file => uploadToS3(file)));
            updateFields.media = uploadedImages;
        }

        const existingEvent = await Event.findById(eventId);
        if (!existingEvent) return sendResponse(res, false, [], "Event not found", 404);

        // 🔹 Check important fields for notification
        const fieldsToNotify = [
            "eventDescription", "eventDateFrom", "eventDateTo",
            "eventTimeFrom", "eventTimeTo", "eventVenue",
            "eventGuidance", "ticketPrice"
        ];

        let hasImportantChange = false;
        const messages = [];

        fieldsToNotify.forEach(field => {
            if (updateFields[field] !== undefined && updateFields[field] != existingEvent[field]) {
                hasImportantChange = true;

                // Generate engaging messages per field
                switch (field) {
                    case "eventDescription":
                        messages.push(`Exciting updates to the event details!`);
                        break;
                    case "eventDateFrom":
                    case "eventDateTo":
                        messages.push(`Dates of "${existingEvent.eventTitle}" have been updated. Check the new schedule!`);
                        break;
                    case "eventTimeFrom":
                    case "eventTimeTo":
                        messages.push(`The event timing has changed. Don't miss it!`);
                        break;
                    case "eventVenue":
                        messages.push(`Venue changed! Find "${existingEvent.eventTitle}" at the new location.`);
                        break;
                    case "eventGuidance":
                        messages.push(`New visitor guidance added for "${existingEvent.eventTitle}".`);
                        break;
                    case "ticketPrice":
                        messages.push(`Ticket price updated! Secure your spot now.`);
                        break;
                    default:
                        messages.push(`${field} updated.`);
                }
            }
        });

        // Update the event
        const updatedEvent = await Event.findByIdAndUpdate(eventId, updateFields, { new: true });

        // 🔹 Trigger notification if important fields changed
        if (hasImportantChange) {
            const config = await AppConfig.findOne({ isActive: true });
            if (config?.enable_event_update_notification) {
                const notificationText = messages.join(" "); // Combine all messages
                const userId = null; // Replace with logic to notify interested users
                sendNotification("UPDATE_EVENT_NOTIFICATION", eventId, userId, notificationText);
            }
        }

        return sendResponse(res, true, updatedEvent, "Event updated successfully", 200);
    } catch (error) {
        console.log("Update Event Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};


// 🔹 Delete Event (Soft Delete)
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
        console.log("Delete Event Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};


// Events with the highest RSVPs (attendance count).
// Events with the highest likes (from FavoriteEvent).
// Events that have been shared the most (from SharedEvent).
exports.getPopularEvents = async (req, res) => {
    try {
        let filters = { isActive: true, eventDateTo: { $gte: new Date() } }; // Only fetch active events
        const userId = req.body.userId;
        // Aggregate like counts from FavoriteEvent
        const likeCounts = await FavoriteEvent.aggregate([
            { $match: { isFavorite: true } },
            { $group: { _id: "$eventId", likeCount: { $sum: 1 } } }
        ]);

        if (req.body.eventId) {
            filters._id = { $ne: req.body.eventId }; // 👈 exclude this event
        }

        // Aggregate share counts from SharedEvent
        const shareCounts = await SharedEvent.aggregate([
            { $group: { _id: "$eventId", shareCount: { $sum: 1 } } }
        ]);

        // Convert results to a map for quick lookup
        const likeCountMap = new Map(likeCounts.map(({ _id, likeCount }) => [_id.toString(), likeCount]));
        const shareCountMap = new Map(shareCounts.map(({ _id, shareCount }) => [_id.toString(), shareCount]));

        // Fetch active events
        let events = await Event.find(filters); //.populate("eventCategory organizerId");

        const eventIds = events.map(event => event._id);
        // ⭐ Fetch favorites for this user
        let favoriteMap = new Set();
        if (userId) {
            const favorites = await FavoriteEvent.find({
                userId,
                eventId: { $in: eventIds },
                isFavorite: true,
                isActive: true
            }).select("eventId");

            favoriteMap = new Set(favorites.map(fav => fav.eventId.toString()));
        }

        // Enhance events with likeCount, shareCount, formatted media, and bannerUrl
        events = events.map(event => {
            const eventIdStr = event._id.toString();
            const likeCount = likeCountMap.get(event._id.toString()) || 0;
            const shareCount = shareCountMap.get(event._id.toString()) || 0;

            // Format media array
            const formattedMedia = event.media?.map((url) => {
                const extension = url.split('.').pop().toLowerCase();
                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                    return { type: "image", url };
                } else if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
                    return { type: "video", url };
                }
                return { type: "unknown", url };
            }) || [];

            // Determine bannerUrl (first available image or empty string)
            const imageMedia = formattedMedia.find((media) => media.type === "image");
            const bannerUrl = imageMedia ? imageMedia.url : "";

            // Format the event response using formatEventResponse
            const formattedEvent = formatPopularEventResponse(event);
            formattedEvent.bannerUrl = bannerUrl;
            // formattedEvent.media = formattedMedia;
            // formattedEvent.likeCount = likeCount;
            // formattedEvent.shareCount = shareCount;
            formattedEvent.isFavorite = favoriteMap.has(eventIdStr)

            return formattedEvent;
        });

        // Sort events based on like & share count
        events.sort((a, b) => (b.likeCount + b.shareCount) - (a.likeCount + a.shareCount));

        return sendResponse(res, true, events.slice(0, 10), "Popular events fetched successfully", 200);
    } catch (error) {
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};


// Events in the same category as events the user has liked before.
// Events the user’s friends have liked (Optional, if friend system exists).
// Events happening near the user’s location (Optional, if location is available).
exports.getRecommendedEvents = async (req, res) => {
    try {
        let filters = { isActive: true, eventDateTo: { $gte: new Date() } }; // Only fetch active events
        const { userId } = req.body; // Assuming user ID is available from authentication
        if (!userId) {
            return sendResponse(res, false, [], "User not authenticated", 401);
        }

        if (req.body.eventId) {
            filters._id = { $ne: req.body.eventId }; // 👈 exclude this event
        }

        // Fetch user's favorite categories or event interactions
        const userFavorites = await FavoriteEvent.find({ userId, isFavorite: true }).populate("eventId");
        const preferredCategories = [...new Set(userFavorites.map(fav => fav.eventId?.eventCategory?.toString()))];

        // Aggregate like and share counts
        const likeCounts = await FavoriteEvent.aggregate([
            { $match: { isFavorite: true } },
            { $group: { _id: "$eventId", likeCount: { $sum: 1 } } }
        ]);
        const shareCounts = await SharedEvent.aggregate([
            { $group: { _id: "$eventId", shareCount: { $sum: 1 } } }
        ]);

        // Convert counts to maps
        const likeCountMap = new Map(likeCounts.map(({ _id, likeCount }) => [_id.toString(), likeCount]));
        const shareCountMap = new Map(shareCounts.map(({ _id, shareCount }) => [_id.toString(), shareCount]));

        // Fetch active events, prioritizing those in user's preferred categories
        let query = filters;
        if (preferredCategories.length) {
            query.eventCategory = { $in: preferredCategories };
        }

        let events = await Event.find(query);

        // Enhance events with media, banner, and like/share counts
        events = events.map(event => {
            const likeCount = likeCountMap.get(event._id.toString()) || 0;
            const shareCount = shareCountMap.get(event._id.toString()) || 0;

            // Format media array
            const formattedMedia = event.media?.map(url => {
                const extension = url.split('.').pop().toLowerCase();
                return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)
                    ? { type: "image", url }
                    : ['mp4', 'mov', 'avi', 'mkv'].includes(extension)
                        ? { type: "video", url }
                        : { type: "unknown", url };
            }) || [];

            // Determine bannerUrl (first available image)
            const imageMedia = formattedMedia.find(media => media.type === "image");
            const bannerUrl = imageMedia ? imageMedia.url : "";

            // Format event response
            const formattedEvent = formatRecommendedEventResponse(event);
            formattedEvent.bannerUrl = bannerUrl;
            // formattedEvent.media = formattedMedia;
            // formattedEvent.likeCount = likeCount;
            // formattedEvent.shareCount = shareCount;

            return formattedEvent;
        });

        // Sort recommended events by like & share count
        events.sort((a, b) => (b.likeCount + b.shareCount) - (a.likeCount + a.shareCount));

        return sendResponse(res, true, events.slice(0, 10), "Recommended events fetched successfully", 200);
    } catch (error) {
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};



