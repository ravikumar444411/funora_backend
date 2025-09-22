const express = require('express');
const {
    pushNotification,
    getUserNotifications,
    markNotificationRead,
    markAllAsRead
} = require('../controllers/notification.controller');

const router = express.Router();

// Routes
router.post('/send', pushNotification);
router.post('/fetch', getUserNotifications);
router.post('/mark-read', markNotificationRead);
router.post('/mark-all-Read', markAllAsRead);


// router.post('/store-token', storeToken);
// router.post('/master', getUserNotifications);

module.exports = router;
