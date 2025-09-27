const express = require('express');
const {
    pushNotification,
    getUserNotifications,
    markNotificationRead,
    markAllAsRead,
    fcmPushNotification,
    storeToken
} = require('../controllers/notification.controller');

const router = express.Router();

// Routes
router.post('/send', pushNotification);
router.post('/fetch', getUserNotifications);
router.post('/mark-read', markNotificationRead);
router.post('/mark-all-Read', markAllAsRead);

//firebase push notificaton
router.post('/store-token', storeToken);
router.post('/fcm', fcmPushNotification);
// router.post('/master', getUserNotifications);

module.exports = router;
