const { sendResponse, formatFavoriteEventResponse } = require("../utils/responseFormatter");
const FavoriteEvent = require('../models/favorite_event.model');
const Category = require("../models/category.model");
const Attendee = require("../models/attendee.model");


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
