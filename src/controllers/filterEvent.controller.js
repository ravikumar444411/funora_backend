const Event = require("../models/event.model");
const Attendee = require("../models/attendee.model");
const Category = require("../models/category.model");
const FavoriteEvent = require("../models/favorite_event.model");
const { sendResponse, formatEventResponse } = require("../utils/responseFormatter");

//hero api
exports.getFilteredEvents = async (req, res) => {
    try {
        const userId = req.body.userId;
        let filters = { isActive: true }; // Only fetch active events

        // 🔍 Keyword Search (Title & Description)
        if (req.body.search) {
            filters.$or = [
                { eventTitle: { $regex: req.body.search, $options: "i" } },
                { eventDescription: { $regex: req.body.search, $options: "i" } }
            ];
        }

        // 🎯 Filter by Multiple Categories (Using categoryType)
        if (req.body.categories) {
            const categoriesArray = req.body.categories.split(",");

            // Fetch category IDs based on categoryType
            const categoryDocs = await Category.find({ categoryType: { $in: categoriesArray } });
            const categoryIds = categoryDocs.map(cat => cat._id.toString());

            filters.eventCategory = { $in: categoryIds };
        }

        // 📅 Date Range Filter
        if (req.body.startDate) {
            filters.eventDateFrom = { $gte: new Date(req.body.startDate) };
        }
        if (req.body.endDate) {
            filters.eventDateTo = { $lte: new Date(req.body.endDate) };
        }

        // 📍 Location-Based Filtering (City)
        if (req.body.city) {
            filters.eventVenue = { $regex: req.body.city, $options: "i" };
        }

        // 💰 Price-Based Filtering
        if (req.body.price === "free") {
            filters.ticketPrice = 0;
        } else if (req.body.price === "paid") {
            filters.ticketPrice = { $gt: 0 };
        }

        // 🌍 Event Type (Online / In-Person)
        if (req.body.type) {
            filters.isOnline = req.body.type === "online";
        }

        // 🔽 Sorting (default: newest first)
        let sortOptions = { eventDateFrom: -1 };
        if (req.body.sort === "oldest") {
            sortOptions = { eventDateFrom: 1 };
        } else if (req.body.sort === "priceAsc") {
            sortOptions = { ticketPrice: 1 };
        } else if (req.body.sort === "priceDesc") {
            sortOptions = { ticketPrice: -1 };
        }

        // 📜 Pagination
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 5;
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


        const eventIds = events.map(event => event._id);

        // Get counts of "going" and "interested" attendees for those events
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

        // Format counts into a map: eventId => { going: X, interested: Y }
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

        // Format response
        const formattedEvents = events.map(event => {
            const eventIdStr = event._id.toString();
            const counts = attendeeCountMap[eventIdStr] || { going: 0, interested: 0 };



            // Format media array
            const formattedMedia = event.media.map((url) => {
                const extension = url.split('.').pop().toLowerCase();
                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                    return { type: "image", url };
                } else if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
                    return { type: "video", url };
                }
                return { type: "unknown", url };
            });

            // Determine bannerUrl (first image URL or empty string)
            const videoMedia = formattedMedia.find((media) => media.type === "video");
            const videoUrl = videoMedia ? videoMedia.url : "";

            // Determine bannerUrl (first image URL or empty string)
            const imageMedia = formattedMedia.find((media) => media.type === "image");
            const bannerUrl = imageMedia ? imageMedia.url : "";

            return {
                ...formatEventResponse(event),
                categoryType: categoryMap[event.eventCategory.toString()] || "Unknown",
                media: formattedMedia,
                videoUrl: videoUrl,
                bannerUrl: bannerUrl,
                goingCount: counts.going,
                interestedCount: counts.interested,
                isFavorite: favoriteMap.has(eventIdStr)
            };
        });


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