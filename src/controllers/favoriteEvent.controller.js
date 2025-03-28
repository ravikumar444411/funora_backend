const { sendResponse, formatFavoriteEventResponse } = require("../utils/responseFormatter");
const FavoriteEvent = require('../models/favorite_event.model');



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

        const favoriteEvents = await FavoriteEvent.find({ userId }).populate("eventId");
        const formattedEvents = favoriteEvents.map(formatFavoriteEventResponse);

        return sendResponse(res, true, formattedEvents, "Favorite events fetched successfully", 200);
    } catch (error) {
        console.log("Error fetching favorite events:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};