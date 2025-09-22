const axios = require("axios");
const Event = require('../models/event.model');
require("../config/loadEnv");

const JOB_SERVICE_BASE_URL = process.env.JOB_SERVICE_BASEURL;


exports.sendNotification = async (useFor, eventId, userId, notificationText) => {
    try {
        // 🔹 Fetch event details
        const event = await Event.findOne({ _id: eventId, isActive: true }).lean();

        if (!event) {
            console.log(`❌ Event not found for ID: ${eventId}`);
            return;
        }

        // 🔹 Build payload with required keys
        let payload = {
            eventId: event._id.toString(),
            title: event.eventTitle,
            body: notificationText,
            imageUrl: event.mainImage?.rectangle || null,
            type: "event",
            deepLink: `funora://event/${eventId}`,
            status: "sent",
            source: "system",
            metadata: {
                venue: event.eventVenue,
                startDate: event.eventDateFrom,
                endDate: event.eventDateTo
            },
            useFor: useFor
        };

        let apiUrl = "";

        if (useFor === 'REMINDER_NOTIFICATION') {
            payload.userId = userId;
            payload.type = "reminder";
            payload.priority = "high";
            payload.eventDateFrom = event.eventDateFrom;
            payload.eventTimeFrom = event.eventTimeFrom;
            apiUrl = "api/reminder/queue";
            payload.body = `Get excited! ‘${event.eventTitle}’ is happening soon, and it’s going to be unforgettable!`;
        } else if (useFor === 'CREATE_EVENT_NOTIFICATION') {
            payload.type = "trending";
            payload.priority = "low";
            apiUrl = "api/event/queue";
        } else if (useFor === 'UPDATE_EVENT_NOTIFICATION') {
            payload.type = "system_alert";
            payload.priority = "high";
            apiUrl = "api/event/queue";
        } else {
            console.warn(`⚠️ Unknown notification type: ${useFor}`);
            return;
        }

        try {
            // 🔹 Call your notification API
            await axios.post(`${JOB_SERVICE_BASE_URL}/${apiUrl}`, payload, {
                headers: { "Content-Type": "application/json" }
            });

            console.log(`Notification payload sent successfully for event ${eventId}`);
        } catch (apiError) {
            console.error(`Failed to send notification for event ${eventId}:`, apiError.message);
            // Optional: retry logic or send to queue for retry
        }

    } catch (error) {
        console.error(`sendNotification error for event ${eventId}:`, error.message);
        // Optional: you can throw the error if you want the caller/queue to handle it
    }
};

