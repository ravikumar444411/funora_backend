const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: false // Only required for event-based notifications
    },
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['reminder', 'promotion', 'system_alert', 'trending'],
        required: true
    },
    imageUrl: {
        type: String, // Optional image for rich notifications
        default: null
    },
    deepLink: {
        type: String, // Link to open a specific screen in the app
        default: null
    },
    isRead: {
        type: Boolean,
        default: false // Track if the notification has been seen
    },
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'delivered', 'read'],
        default: 'pending'
    },
    source: {
        type: String, // Who generated it? System, Admin, etc.
        enum: ['system', 'admin', 'user'],
        default: 'system'
    },
    metadata: {
        type: Object, // Extra details like event name, organizer info
        default: {}
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
