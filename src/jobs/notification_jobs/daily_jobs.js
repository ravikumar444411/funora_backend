const { Queue } = require("bullmq");
const cron = require("node-cron");
const FavoriteEvent = require("../../models/favorite_event.model");
const redisConnection = require("../../config/redis");



// Initialize Redis connection for BullMQ
const favoriteEventQueue = new Queue("favorite-events-queue", { connection: redisConnection });

// Function to fetch and queue favorite events
const runDailyJobs = async () => {
    console.log(`⏰ Running daily task at ${new Date().toLocaleTimeString()}...`);

    try {
        const mostFavoriteEvents = await FavoriteEvent.aggregate([
            { $match: { isFavorite: true } },
            {
                $group: {
                    _id: "$eventId",
                    favoriteCount: { $sum: 1 }
                }
            },
            { $sort: { favoriteCount: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "events",
                    localField: "_id",
                    foreignField: "_id",
                    as: "eventDetails"
                }
            },
            { $unwind: "$eventDetails" },
            {
                $project: {
                    _id: 1,
                    favoriteCount: 1,
                    "eventDetails.eventTitle": 1,
                    "eventDetails.eventDescription": 1,
                    "eventDetails.eventDateFrom": 1,
                    "eventDetails.eventDateTo": 1,
                    "eventDetails.eventVenue": 1,
                    "eventDetails.media": 1
                }
            }
        ]);

        if (mostFavoriteEvents.length > 0) {
            console.log("🔥 Queuing Top 10 Most Favorite Events...");

            // Add events to the BullMQ queue
            for (const event of mostFavoriteEvents) {
                await favoriteEventQueue.add("process-favorite-event", event, {
                    attempts: 3, // Retry up to 3 times if it fails
                    removeOnComplete: true, // Remove from queue after completion
                    removeOnFail: false
                });
            }

            console.log("✅ Events successfully added to the queue.");
        } else {
            console.log("ℹ️ No favorite events found.");
        }
    } catch (error) {
        console.error("❌ Error running daily job:", error);
    }
};

// Schedule the cron job to run at 8 AM daily
cron.schedule("0 8 * * *", () => {
    console.log("🚀 Executing scheduled job at 8 AM...");
    runDailyJobs();
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

console.log("✅ Daily cron job scheduled at 8 AM");

module.exports = runDailyJobs;
