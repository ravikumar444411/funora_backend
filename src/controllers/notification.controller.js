const Notification = require('../models/notification.model');

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
            notificationId,
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


