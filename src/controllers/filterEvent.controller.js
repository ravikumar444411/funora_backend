const Event = require("../models/event.model");
const Attendee = require("../models/attendee.model");
const Category = require("../models/category.model");
const FavoriteEvent = require("../models/favorite_event.model");
const { sendResponse, formatEventResponse } = require("../utils/responseFormatter");
const moment = require('moment');

//hero api
exports.getFilteredEvents = async (req, res) => {
    try {
        const userId = req.body.userId;
        let filters = { isActive: true, eventDateTo: { $gte: new Date() } }; // Only fetch active events

        // 🔍 Keyword Search (Title & Description)
        if (req.body.search) {
            filters.$or = [
                { eventTitle: { $regex: req.body.search, $options: "i" } },
                { eventDescription: { $regex: req.body.search, $options: "i" } }
            ];
        }

        // 🎯 Filter by Multiple Categories (Using categoryType or comma-separated string)
        if (req.body.categories && req.body.categories.length > 0) {
            let categoriesArray = req.body.categories;

            // Handle comma-separated string
            if (typeof categoriesArray === 'string') {
                categoriesArray = categoriesArray.split(',').map(cat => cat.trim().toLowerCase());
            } else {
                categoriesArray = categoriesArray.map(cat => cat.trim().toLowerCase());
            }

            // If "all" is NOT included, apply filtering
            if (!categoriesArray.includes('all')) {
                const categoryDocs = await Category.find({ categoryType: { $in: categoriesArray } });
                const categoryIds = categoryDocs.map(cat => cat._id.toString());
                filters.eventCategory = { $in: categoryIds };
            }
        }




        // 📅 Date Filter using selectedDay or custom range
        const dateFilter = getFilterByDateType(req.body.selectedDay, req.body.startDate, req.body.endDate);



        // 💰 Price-Based Filtering (if type includes "free")
        if (req.body.type && req.body.type === "free") {
            filters.ticketPrice = 0;
        } else {
            if (req.body.priceRange && typeof req.body.priceRange.min === 'number' && typeof req.body.priceRange.max === 'number') {
                filters.ticketPrice = {
                    $gte: req.body.priceRange.min,
                    $lte: req.body.priceRange.max
                };
            }

        }


        filters = {
            ...dateFilter,
            ...filters
        };


        // // 💰 Price-Based Filtering
        // if (req.body.price === "free") {
        //     filters.ticketPrice = 0;
        // } else if (req.body.price === "paid") {
        //     filters.ticketPrice = { $gt: 0 };
        // }

        // // 🌍 Event Type (Online / In-Person)
        // if (req.body.type) {
        //     filters.isOnline = req.body.type === "online";
        // }

        // 🔽 Sorting (default: newest first by eventDateFrom)
        let sortOptions = { eventDateFrom: 1 }; // Default → Descending (latest first)

        if (req.body.sort === "oldest") {
            sortOptions = { eventDateFrom: 1 };   // Ascending (oldest first)
        } else if (req.body.sort === "latest") {
            sortOptions = { eventDateFrom: -1 };  // Descending (latest first)
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
        const allEvents = await Event.find(filters)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);


        // 📅 time Filter using selectedTime or custom range
        const events = filterEventsByTimeSlot(
            allEvents,
            req.body.selectedTime,
            req.body.fromTime,
            req.body.toTime
        );


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


const getFilterByDateType = (selectedDay, startDate, endDate) => {
    if (selectedDay) {
        switch (selectedDay.toLowerCase()) {
            case 'today': {
                const todayStart = moment().startOf('day').toDate();
                const todayEnd = moment().endOf('day').toDate();

                return {
                    eventDateFrom: { $gte: todayStart, $lte: todayEnd }
                };
            }

            case 'weekend': {
                // 1 = Sunday, 7 = Saturday
                return {
                    $expr: {
                        $in: [{ $dayOfWeek: '$eventDateFrom' }, [1, 7]]
                    }
                };
            }

            case 'weekday': {
                // 2 to 6 => Monday to Friday
                return {
                    $expr: {
                        $in: [{ $dayOfWeek: '$eventDateFrom' }, [2, 3, 4, 5, 6]]
                    }
                };
            }

            case 'month': {
                const startOfMonth = moment().startOf('month').toDate();
                const endOfMonth = moment().endOf('month').toDate();

                return {
                    eventDateFrom: { $gte: startOfMonth, $lte: endOfMonth }
                };
            }

            case 'custom': {
                if (startDate && endDate) {
                    const from = new Date(startDate);
                    const to = new Date(endDate);
                    return {
                        eventDateFrom: { $gte: from, $lte: to }
                    };
                } else {
                    return {}; // No range provided, return all
                }
            }

            case 'all':
            default:
                return {}; // No filter
        }
    } else {
        return {};
    }

};


// Utility to check overlapping time ranges
function isTimeOverlapping(eventStart, eventEnd, slotStart, slotEnd) {
    return eventStart.isBefore(slotEnd) && eventEnd.isAfter(slotStart);
}

// Main filtering function
function filterEventsByTimeSlot(events, selectedSlot, customStartTime, customEndTime) {
    if (selectedSlot) {
        const slot = selectedSlot.toLowerCase();
        let slotStart, slotEnd;

        switch (slot) {
            case 'morning':
                slotStart = moment('05:00', 'HH:mm');
                slotEnd = moment('12:00', 'HH:mm');
                break;
            case 'afternoon':
                slotStart = moment('12:00', 'HH:mm');
                slotEnd = moment('17:00', 'HH:mm');
                break;
            case 'evening':
                slotStart = moment('17:00', 'HH:mm');
                slotEnd = moment('21:00', 'HH:mm');
                break;
            case 'night':
                slotStart = moment('21:00', 'HH:mm');
                slotEnd = moment('23:59', 'HH:mm');
                break;
            case 'custom':
                if (customStartTime && customEndTime) {
                    const customStart = moment(customStartTime, ["h:mm A"]).format("HH:mm");
                    const customEnd = moment(customEndTime, ["h:mm A"]).format("HH:mm");
                    slotStart = moment(customStart, 'HH:mm');
                    slotEnd = moment(customEnd, 'HH:mm');
                } else {
                    return events; // fallback to all if custom values are missing
                }
                break;
            case 'all':
            default:
                return events; // return everything if no specific filter
        }

        return events.filter(event => {
            if (!event.eventTimeFrom || !event.eventTimeTo) return false;

            const eventStart = moment(event.eventTimeFrom, 'HH:mm');
            const eventEnd = moment(event.eventTimeTo, 'HH:mm');

            return isTimeOverlapping(eventStart, eventEnd, slotStart, slotEnd);
        });
    } else {
        return events;
    }

}




