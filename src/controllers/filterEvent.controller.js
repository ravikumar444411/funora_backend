const Event = require("../models/event.model");
const { sendResponse } = require("../utils/responseFormatter");

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

        //Filter by Multiple Categories (Array Support)
        if (req.query.categories) {
            const categoriesArray = req.query.categories.split(","); // Convert comma-separated list to array
            filters.eventCategory = { $in: categoriesArray }; // Match any category in the array
        }


        // 📅 Date Range Filter
        if (req.query.startDate) {
            filters.eventDateFrom = { $gte: new Date(req.query.startDate) };
        }
        if (req.query.endDate) {
            filters.eventDateTo = { $lte: new Date(req.query.endDate) };
        }

        // // ⏰ Time of Day Filter
        // if (req.query.timeOfDay) {
        //     const timeRanges = {
        //         morning: ["06:00", "12:00"],
        //         afternoon: ["12:00", "18:00"],
        //         evening: ["18:00", "24:00"],
        //         night: ["00:00", "06:00"]
        //     };
        //     const [startTime, endTime] = timeRanges[req.query.timeOfDay] || [];
        //     if (startTime && endTime) {
        //         filters.eventTimeFrom = { $gte: startTime };
        //         filters.eventTimeTo = { $lte: endTime };
        //     }
        // }

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
        let sortOptions = { eventDateFrom: -1 }; // Default: Newest first
        if (req.query.sort === "oldest") {
            sortOptions = { eventDateFrom: 1 };
        } else if (req.query.sort === "priceAsc") {
            sortOptions = { ticketPrice: 1 };
        } else if (req.query.sort === "priceDesc") {
            sortOptions = { ticketPrice: -1 };
        }


        // 📜 Infinite Scroll (Pagination)
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 5; // Default limit to 5 events per page
        const skip = (page - 1) * limit;

        // Fetch total event count (for frontend reference)
        const totalEvents = await Event.countDocuments(filters);

        // Fetch paginated events
        const events = await Event.find(filters)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        return sendResponse(res, true, { events, totalEvents, currentPage: page, totalPages: Math.ceil(totalEvents / limit) }, "Events fetched successfully", 200);

    } catch (error) {
        console.log("Error fetching events:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};
