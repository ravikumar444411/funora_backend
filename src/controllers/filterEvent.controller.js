const Event = require("../models/event.model");
const Category = require("../models/category.model");
const { sendResponse, formatEventResponse } = require("../utils/responseFormatter");

//hero api
exports.getFilteredEvents = async (req, res) => {
    try {
        let filters = { isActive: true }; // Only fetch active events

        // 🔍 Keyword Search (Title & Description)
        if (req.query.search) {
            filters.$or = [
                { eventTitle: { $regex: req.query.search, $options: "i" } },
                { eventDescription: { $regex: req.query.search, $options: "i" } }
            ];
        }

        // 🎯 Filter by Multiple Categories (Using categoryType)
        if (req.query.categories) {
            const categoriesArray = req.query.categories.split(",");

            // Fetch category IDs based on categoryType
            const categoryDocs = await Category.find({ categoryType: { $in: categoriesArray } });
            const categoryIds = categoryDocs.map(cat => cat._id.toString());

            filters.eventCategory = { $in: categoryIds };
        }

        // 📅 Date Range Filter
        if (req.query.startDate) {
            filters.eventDateFrom = { $gte: new Date(req.query.startDate) };
        }
        if (req.query.endDate) {
            filters.eventDateTo = { $lte: new Date(req.query.endDate) };
        }

        // 📍 Location-Based Filtering (City)
        if (req.query.city) {
            filters.eventVenue = { $regex: req.query.city, $options: "i" };
        }

        // 💰 Price-Based Filtering
        if (req.query.price === "free") {
            filters.ticketPrice = 0;
        } else if (req.query.price === "paid") {
            filters.ticketPrice = { $gt: 0 };
        }

        // 🌍 Event Type (Online / In-Person)
        if (req.query.type) {
            filters.isOnline = req.query.type === "online";
        }

        // 🔽 Sorting (default: newest first)
        let sortOptions = { eventDateFrom: -1 };
        if (req.query.sort === "oldest") {
            sortOptions = { eventDateFrom: 1 };
        } else if (req.query.sort === "priceAsc") {
            sortOptions = { ticketPrice: 1 };
        } else if (req.query.sort === "priceDesc") {
            sortOptions = { ticketPrice: -1 };
        }

        // 📜 Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // Fetch total event count
        const totalEvents = await Event.countDocuments(filters);

        // Fetch events
        const events = await Event.find(filters)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        // Fetch categoryType for each event
        const categoryIds = [...new Set(events.map(event => event.eventCategory.toString()))];
        const categoryMap = await Category.find({ _id: { $in: categoryIds } })
            .then(categories => categories.reduce((acc, cat) => {
                acc[cat._id.toString()] = cat.categoryType;
                return acc;
            }, {}));

        // Format media array
        const formatMedia = (mediaArray) => {
            return mediaArray.map(url => {
                const isImage = /\.(jpg|jpeg|png|gif)$/i.test(url);
                const isVideo = /\.(mp4|mov|avi|wmv|mkv)$/i.test(url);
                return isImage ? { type: "image", url } : isVideo ? { type: "video", url } : null;
            }).filter(Boolean);
        };

        // Format response
        const formattedEvents = events.map(event => ({
            ...formatEventResponse(event),
            categoryType: categoryMap[event.eventCategory.toString()] || "Unknown",
            media: formatMedia(event.media || [])
        }));

        return sendResponse(res, true, {
            events: formattedEvents,
            totalEvents,
            currentPage: page,
            totalPages: Math.ceil(totalEvents / limit)
        }, "Events fetched successfully", 200);

    } catch (error) {
        console.log("Error fetching events:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};