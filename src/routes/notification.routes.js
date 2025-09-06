const express = require('express');
const {
    pushNotification,
    storeToken,
    getUserNotifications
} = require('../controllers/notification.controller');

const router = express.Router();

// Routes
router.post('/send', pushNotification);
router.post('/store-token', storeToken);
router.post('/fetch', getUserNotifications);
router.post('/master', getUserNotifications);

module.exports = router;
