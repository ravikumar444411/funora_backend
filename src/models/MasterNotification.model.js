const mongoose = require('mongoose');

const MasterNotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['event_create', 'event_update', 'promotion', 'system_announcement'],
        default: 'event_create'
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: false // Only if the notification is linked to an event
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional: can be system or admin
    },
    imageUrl: {
        type: String,
        default: null // For banners or rich media notifications
    },
    deepLink: {
        type: String,
        default: null // e.g., "funora://event/123"
    },
    notifiCationCategory: {
        type: String,
        enum: ['event_reminder', 'security_alert', 'promo'],
        default: 'event_reminder'
    },
    metadata: {
        type: Object,
        default: {} // Extra info like event name, category, etc.
    },
    expirationAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('MasterNotification', MasterNotificationSchema);
