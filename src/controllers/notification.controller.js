const admin = require("../config/firebaseAdmin");
const User = require("../models/user.model");
const Notification = require('../models/notification.model'); // Import your Notification schema

// Function to send push notifications
async function sendPushNotification(userId, title, body) {
    try {
        // Find the user and get the FCM token
        const user = await User.findById(userId);

        if (!user || !user.fcmToken) {
            console.log("No FCM token found for user:", userId);
            return false; // Indicate failure
        }

        // Prepare the message
        const message = {
            notification: {
                title,
                body,
            },
            token: user.fcmToken,
        };

        // Send the notification
        await admin.messaging().send(message);
        console.log("Notification sent successfully to:", userId);
        return true; // Indicate success
    } catch (error) {
        console.error("Error sending notification:", error);
        return false; // Indicate failure
    }
}



// Endpoint to send push notification
exports.pushNotification = async (req, res) => {
    try {
        const { userId, title, body, data, imageUrl, deepLink } = req.body;

        // Validate input
        if (!userId || !title || !body) {
            return res.status(400).json({ error: "User ID, title, and body are required" });
        }

        // Create a notification entry in the database
        const notification = new Notification({
            userId,
            title,
            body,
            type: "reminder",
            imageUrl: imageUrl || null,
            deepLink: deepLink || null,
            status: "pending",
            metadata: data || {},
        });

        await notification.save();

        // Attempt to send the push notification
        const isSent = await sendPushNotification(userId, title, body, data, imageUrl, deepLink);

        if (!isSent) {
            notification.status = "failed";
            await notification.save();
            return res.status(500).json({ error: "Failed to send notification" });
        }

        // Update status to "sent" in DB
        notification.status = "sent";
        notification.sentAt = new Date();
        await notification.save();

        res.json({ message: "Notification sent successfully", notification });
    } catch (error) {
        console.error("Error handling push notification request:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


// Endpoint to store FCM token
exports.storeToken = async (req, res) => {
    try {
        const { userId, token } = req.body;

        // Validate input
        if (!userId || !token) {
            return res.status(400).json({ error: "User ID and token are required" });
        }

        // Find the user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Update the FCM token
        user.fcmToken = token;
        await user.save();

        res.json({ message: "FCM token stored successfully" });
    } catch (error) {
        console.error("Error storing token:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.body; // User ID from request parameters
        const { status, isRead, limit = 10, page = 1 } = req.body; // Filters and pagination

        // Validate input
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // Query conditions
        let query = { userId };

        if (status) query.status = status; // Filter by status (e.g., "sent", "failed")
        // if (isRead !== undefined) query.isRead = isRead === "true"; // Filter by read/unread

        // Pagination settings
        const skip = (page - 1) * limit;

        // Fetch notifications
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 }) // Show latest notifications first
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const totalCount = await Notification.countDocuments(query);

        res.json({
            total: totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            notifications,
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
