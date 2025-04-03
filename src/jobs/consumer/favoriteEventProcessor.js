const { Worker } = require("bullmq");
const axios = require("axios");
const redisConnection = require("../../config/redis");

// Create a worker to process queued favorite events
const favoriteEventWorker = new Worker(
    "favorite-events-queue",
    async (job) => {
        const event = job.data;

        console.log(`🎟 Processing Favorite Event: ${event.eventDetails.eventTitle}`);

        try {
            // Call API to send notification
            const response = await axios.post("http://localhost:3000/api/notification/send", {
                userId: "67e6807b38a7200f12555b14",
                title: "Funora Event",
                body: `Your event "${event.eventDetails.eventTitle}" starts soon!`,
                data: {
                    eventTitle: event.eventDetails.eventTitle,
                    eventBody: `Your event "${event.eventDetails.eventDescription}" starts soon!`,
                    eventId: event.eventDetails._id,
                    eventName: event.eventDetails.eventTitle,
                    timestamp: new Date().toISOString(),
                    location: event.eventDetails.eventVenue || "Unknown location"
                },
                imageUrl: "https://tinyjpg.com/images/social/website.jpg",
                deepLink: "https://tinyjpg.com/images/social/website.jpg"
            });

            console.log(`📩 Notification Sent: ${response.status} - ${response.data.message}`);
        } catch (error) {
            console.error("❌ Error Sending Notification:", error.response ? error.response.data : error.message);
        }

        console.log(`✅ Processed event: ${event.eventDetails.eventTitle}`);
    },
    { connection: redisConnection }
);

console.log("🚀 Favorite Event Processor is running...");

module.exports = favoriteEventWorker;
