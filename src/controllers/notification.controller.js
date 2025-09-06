const admin = require("../config/firebaseAdmin");
const User = require("../models/user.model");
const Notification = require('../models/notification.model');
const MasterNotification = require('../models/MasterNotification.model');
const userNotificationQueue = require("../jobs/queues/userNotificationQueue");

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

const pushNotificationHelper = async ({
    userId,
    title,
    body,
    data = {},
    imageUrl = null,
    deepLink = null,
    type = "reminder",
}) => {
    try {
        console.log("🛠 Creating notification with data:", {
            userId,
            title,
            body,
            type,
            imageUrl,
            deepLink,
            data,
        });

        // Step 1: Create the notification object
        const notification = new Notification({
            userId,
            title,
            body,
            type,
            imageUrl,
            deepLink,
            status: "pending",
            metadata: data,
        });

        console.log("📦 Saving notification to DB...");
        await notification.save();

        // Step 2: Try sending push notification
        console.log("📤 Attempting to send push notification...");
        const isSent = await sendPushNotification(userId, title, body, data, imageUrl, deepLink);

        // Step 3: Update status
        notification.status = isSent ? "sent" : "failed";
        if (isSent) {
            notification.sentAt = new Date();
        }

        console.log("📬 Updating notification status to:", notification.status);
        await notification.save();

        // Step 4: Return result
        return {
            success: isSent,
            message: isSent ? "Notification sent successfully" : "Failed to send notification",
            notification,
        };
    } catch (error) {
        console.error("❌ Error in pushNotificationHelper:", error);
        debugger; // Add debugger to pause if running in Node inspector
        throw error;
    }
};


// Endpoint to send push notification
const pushNotification = async (req, res) => {
    try {
        console.log("📩 Incoming push notification request:", req.body);

        const { userId, title, body, data, imageUrl, deepLink } = req.body;

        // Input validation
        if (!userId || !title || !body) {
            console.warn("⚠️ Missing required fields");
            return res.status(400).json({ error: "User ID, title, and body are required" });
        }

        // Call helper
        const result = await pushNotificationHelper({
            userId,
            title,
            body,
            data,
            imageUrl,
            deepLink,
        });

        // Final response
        if (!result.success) {
            console.error("❌ Notification failed to send:", result.message);
            return res.status(500).json({ error: result.message });
        }

        console.log("✅ Notification sent successfully");
        res.json({ message: result.message, notification: result.notification });
    } catch (error) {
        console.error("❌ Error in pushNotification endpoint:", error);
        debugger;
        res.status(500).json({ error: "Internal Server Error" });
    }
};



// Endpoint to store FCM token
const storeToken = async (req, res) => {
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
const getUserNotifications = async (req, res) => {
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

// create master notification
const createMasterNotification = async ({
    title,
    message,
    type = "event_create",
    eventId,
    imageUrl,
    deepLink,
    category,
    metadata = {}
}) => {
    try {
        const masterNotification = await MasterNotification.create({
            title,
            message,
            type,
            eventId,
            imageUrl,
            deepLink,
            category,
            metadata
        });

        console.log("✅ MasterNotification created:", masterNotification._id);

        // Add a job to the queue (don't wait for completion)
        await userNotificationQueue.add("distribute-to-users", {
            masterNotificationId: masterNotification._id,
        });
        return masterNotification;
    } catch (err) {
        console.error("❌ Error creating master notification:", err);
    }
};

module.exports = {
    sendPushNotification,
    pushNotificationHelper,
    pushNotification,
    storeToken,
    getUserNotifications,
    createMasterNotification
};

