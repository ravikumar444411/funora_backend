const Notification = require('../models/notification.model');
const admin = require("../config/firebaseAdmin");
const User = require("../models/user.model");

const pushNotificationHelper = async ({
    userId,
    eventId,
    title,
    body,
    type,
    priority,
    status,
    imageUrl,
    deepLink,
    source,
    metadata,
}) => {
    try {
        // Step 1: Create notification object
        const notification = new Notification({
            userId,
            eventId,
            title,
            body,
            type,
            imageUrl,
            deepLink,
            priority,
            status,
            source,
            metadata,
        });

        console.log("📦 Saving notification to DB...");
        await notification.save();

        return {
            success: true,
            message: "Notification sent successfully"
        };
    } catch (error) {
        console.error("❌ Error in pushNotificationHelper:", error);
        throw error;
    }
};

// Endpoint to send push notification
exports.pushNotification = async (req, res) => {
    try {
        console.log("📩 Incoming push notification request:", req.body);

        const {
            userId,
            eventId,
            title,
            body,
            type,
            priority,
            imageUrl,
            deepLink,
            source,
            metadata,
        } = req.body;

        // Input validation
        if (!userId || !eventId || !title || !body || !type || !priority || !imageUrl || !deepLink || !source || !metadata) {
            console.warn("⚠️ Missing required fields");
            return res
                .status(400)
                .json({ error: "User ID, title, and body are required" });
        }

        // Call helper
        const result = await pushNotificationHelper({
            userId,
            eventId,
            title,
            body,
            type,
            priority,
            imageUrl,
            deepLink,
            source,
            metadata,
        });

        // Final response
        if (!result.success) {
            console.error("❌ Notification failed to send:", result.message);
            return res.status(500).json({ error: result.message });
        }

        console.log("✅ Notification sent successfully");
        res.json({
            message: result.message
        });
    } catch (error) {
        console.error("❌ Error in pushNotification endpoint:", error);
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

        // if (status) query.status = status;

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


// Endpoint to mark a single notification as read
exports.markNotificationRead = async (req, res) => {
    try {
        const { notificationId } = req.body;

        if (!notificationId) {
            console.warn("Missing notificationId in request");
            return res.status(400).json({ error: "Notification ID is required" });
        }

        // Update the notification directly
        const updatedNotification = await Notification.findByIdAndUpdate(
            { _id: notificationId },
            { $set: { isRead: true, updatedAt: new Date() } },
            { new: true } // return the updated document
        );

        if (!updatedNotification) {
            console.error("❌ Notification not found:", notificationId);
            return res.status(404).json({ success: false, error: "Notification not found" });
        }

        console.log(`✅ Notification ${notificationId} marked as read`);
        res.json({
            success: true,
            message: "Notification marked as read"
        });
    } catch (error) {
        console.error("❌ Error in markNotificationRead endpoint:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};


// ✅ Mark Multiple Notifications as Read by IDs
exports.markAllAsRead = async (req, res) => {
    try {
        const { notificationIds } = req.body; // expecting an array of IDs

        if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
            console.warn("⚠️ Missing or invalid notificationIds in request");
            return res.status(400).json({ error: "Notification IDs are required" });
        }

        // Update all notifications with given IDs
        const result = await Notification.updateMany(
            { _id: { $in: notificationIds }, isRead: false },
            { $set: { isRead: true, updatedAt: new Date() } }
        );

        console.log(`✅ ${result.modifiedCount} notifications marked as read`);

        res.json({
            success: true,
            message: `${result.modifiedCount} notifications marked as read`
        });
    } catch (error) {
        console.error("❌ Error in markAllAsRead endpoint:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
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


// Function to send push notifications
exports.fcmPushNotification = async (req, res) => {
    try {
        const { userId, title, body } = req.body;
        const user = await User.findById(userId);

        if (!user || !user.fcmToken) {
            console.log("No FCM token found for user:", userId);
            return res.status(404).json({ success: false, message: "No FCM token" });
        }

        // Ensure body is string for notification
        const bodyString = typeof body === "string" ? body : JSON.stringify(body);

        const message = {
            notification: {
                title: title,
                body: bodyString, // 🔥 must always be string
            },
            data: {
                payload: bodyString, // 🔥 custom JSON payload
            },
            token: user.fcmToken,
        };

        await admin.messaging().send(message);

        res.json({
            success: true,
            message: `Notification sent successfully to user ${userId}`,
        });
    } catch (error) {
        console.error("Error sending notification:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};