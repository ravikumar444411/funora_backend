const { sendResponse, formatFavoriteEventResponse } = require("../utils/responseFormatter");
const FavoriteEvent = require('../models/favorite_event.model');
const Event = require('../models/event.model');
const Category = require("../models/category.model");
const Attendee = require("../models/attendee.model");
const { sendNotification } = require('../client/notificationClient');
const AppConfig = require("../models/appConfig.model");
const EventSuggestion = require("../models/event_suggestion.model");

//save & remove from favorite events
exports.favoriteEventSave = async (req, res) => {
    try {
        const { eventId, userId } = req.body;

        if (!eventId || !userId) {
            return sendResponse(res, false, [], "Event ID and User ID are required", 400);
        }

        const existingFavorite = await FavoriteEvent.findOne({ eventId, userId });

        if (existingFavorite) {
            existingFavorite.isFavorite = !existingFavorite.isFavorite;
            existingFavorite.updatedAt = new Date();
            await existingFavorite.save();
            return sendResponse(res, true, existingFavorite, "Favorite status toggled successfully", 200);
        }

        const favoriteData = {
            eventId,
            userId,
            isFavorite: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const favoriteEvent = new FavoriteEvent(favoriteData);
        await favoriteEvent.save();

        return sendResponse(res, true, favoriteEvent, "Event favorited successfully", 201);
    } catch (error) {
        console.log("Error favoriting event:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};


//get all favorite events based on user id
exports.getFavoriteEvents = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return sendResponse(res, false, [], "User ID is required", 400);
        }

        // Get user's favorite events with populated event data
        const favoriteEvents = await FavoriteEvent.find({
            userId,
            isFavorite: true,
            isActive: true
        }).populate("eventId");

        const events = favoriteEvents.map(fav => fav.eventId).filter(Boolean);

        if (events.length === 0) {
            return sendResponse(res, true, [], "No favorite events found", 200);
        }

        // Get unique category IDs
        const categoryIds = [...new Set(events.map(event => event.eventCategory.toString()))];
        const categoryMap = await Category.find({ _id: { $in: categoryIds } })
            .then(categories =>
                categories.reduce((acc, cat) => {
                    acc[cat._id.toString()] = cat.categoryType;
                    return acc;
                }, {})
            );

        // Get event IDs
        const eventIds = events.map(event => event._id);

        // Get attendee counts
        const attendeeCounts = await Attendee.aggregate([
            {
                $match: {
                    eventId: { $in: eventIds },
                    status: { $in: ["going", "interested"] },
                    isActive: true
                }
            },
            {
                $group: {
                    _id: { eventId: "$eventId", status: "$status" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const attendeeCountMap = {};
        attendeeCounts.forEach(item => {
            const eventId = item._id.eventId.toString();
            const status = item._id.status;

            if (!attendeeCountMap[eventId]) {
                attendeeCountMap[eventId] = { going: 0, interested: 0 };
            }

            if (status === "going") {
                attendeeCountMap[eventId].going = item.count;
            } else if (status === "interested") {
                attendeeCountMap[eventId].interested = item.count;
            }
        });

        // Create favorite map
        const favoriteMap = new Set(eventIds.map(id => id.toString()));

        // Final response
        const formattedEvents = events.map(event => {
            const eventIdStr = event._id.toString();
            const counts = attendeeCountMap[eventIdStr] || { going: 0, interested: 0 };

            const formattedMedia = (event.media || []).map(url => {
                const extension = url.split('.').pop().toLowerCase();
                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                    return { type: "image", url };
                } else if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
                    return { type: "video", url };
                }
                return { type: "unknown", url };
            });

            const videoMedia = formattedMedia.find(media => media.type === "video");
            const imageMedia = formattedMedia.find(media => media.type === "image");

            return {
                ...formatFavoriteEventResponse(event),
                categoryType: categoryMap[event.eventCategory.toString()] || "Unknown",
                // media: formattedMedia,
                videoUrl: videoMedia ? videoMedia.url : "",
                bannerUrl: imageMedia ? imageMedia.url : "",
                goingCount: counts.going,
                interestedCount: counts.interested,
                isFavorite: favoriteMap.has(eventIdStr)
            };
        });

        return sendResponse(res, true, formattedEvents, "Favorite events fetched successfully", 200);

    } catch (error) {
        console.error("Error fetching favorite events:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};


//save & remove from favorite events
exports.remindMeEvents = async (req, res) => {
    try {
        const { eventId, userId } = req.body;

        if (!eventId || !userId) {
            return sendResponse(res, false, [], "Event ID and User ID are required", 400);
        }

        // Find existing favorite event
        let favoriteEvent = await FavoriteEvent.findOne({ eventId, userId });

        if (favoriteEvent) {
            // Toggle remindMe
            favoriteEvent.remindMe = !favoriteEvent.remindMe;
            await favoriteEvent.save();
        } else {
            // Create new favorite event with remindMe = true
            favoriteEvent = new FavoriteEvent({
                eventId,
                userId,
                isFavorite: false,
                remindMe: true,
            });
            await favoriteEvent.save();
        }

        // 🔹 Trigger notification if remindMe is true
        const config = await AppConfig.findOne({ isActive: true });
        if (config.enable_reminder_notification && favoriteEvent.remindMe) {
            sendNotification("REMINDER_NOTIFICATION", eventId, userId, null);
        }

        return sendResponse(
            res,
            true,
            favoriteEvent,
            "Remind me status updated successfully",
            favoriteEvent.createdAt.getTime() === favoriteEvent.updatedAt.getTime() ? 201 : 200
        );
    } catch (error) {
        console.log("Error updating remind me status:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

//rating to event
exports.rateEvent = async (req, res) => {
    try {
        const { eventId, userId, rating, suggestion } = req.body;

        if (!eventId || !userId || !rating) {
            return sendResponse(res, false, [], "Event ID, User ID, and rating are required", 400);
        }

        if (rating < 1 || rating > 5) {
            return sendResponse(res, false, [], "Rating must be between 1 and 5", 400);
        }

        // Ensure user has "interested" status before rating
        const attendee = await Attendee.findOne({ eventId, userId });
        if (!attendee || attendee.status !== "interested") {
            return sendResponse(res, false, [], "User must be interested in this event before rating", 400);
        }

        // 🔹 Fetch the event
        const event = await Event.findOne({ _id: eventId, isActive: true });
        if (!event) {
            return sendResponse(res, false, [], "Event not found", 404);
        }

        // 🔹 Check if user has already rated this event
        let existingRating = await EventSuggestion.findOne({ eventId, userId });

        if (existingRating) {
            // Update total rating: subtract old rating and add new rating
            const totalRating = event.rating.average * event.rating.count - existingRating.rating + rating;
            event.rating.average = totalRating / event.rating.count;

            // Update suggestion + rating
            existingRating.rating = rating;
            if (suggestion && suggestion.trim() !== "") {
                existingRating.suggestion = suggestion.trim();
            }

            await existingRating.save();
        } else {
            // New rating
            const totalRating = event.rating.average * event.rating.count + rating;
            event.rating.count += 1;
            event.rating.average = totalRating / event.rating.count;

            const newRating = new EventSuggestion({
                eventId,
                userId,
                rating,
                suggestion: suggestion ? suggestion.trim() : "",
            });
            await newRating.save();
        }

        await event.save();

        return sendResponse(
            res,
            true,
            { rating: event.rating },
            "Event rated successfully",
            200
        );
    } catch (error) {
        console.error("Error rating event:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};


exports.checkEventRating = async (req, res) => {
    try {
        const { eventId, userId } = req.body;

        if (!eventId || !userId) {
            return sendResponse(res, false, [], "Event ID and User ID are required", 400);
        }

        // Ensure user has "interested" status before rating
        const attendee = await Attendee.findOne({ eventId, userId });
        if (!attendee || attendee.status !== "interested") {
            return sendResponse(
                res,
                true,
                {
                    isEligible: false,
                    rated: false,
                },
                "User has already rated this event",
                200
            );
        }

        const existingRating = await EventSuggestion.findOne({ eventId, userId });

        if (existingRating) {
            return sendResponse(
                res,
                true,
                {
                    isEligible: true,
                    rated: true,
                    rating: existingRating.rating,
                    suggestion: existingRating.suggestion || null,
                },
                "User has already rated this event",
                200
            );
        } else {
            return sendResponse(
                res,
                true,
                { isEligible: true, rated: false },
                "User has not rated this event yet",
                200
            );
        }
    } catch (error) {
        console.error("Error checking event rating:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};



