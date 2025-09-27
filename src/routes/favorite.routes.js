const express = require('express');
const { favoriteEventSave, getFavoriteEvents, remindMeEvents, rateEvent, checkEventRating } = require('../controllers/favoriteEvent.controller');
const { customAuthMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();


// save to favorite
router.post('/save', customAuthMiddleware, favoriteEventSave);
router.post('/fetch', getFavoriteEvents);
router.post('/remind_me', customAuthMiddleware, remindMeEvents);
router.post('/rate_event', rateEvent);
router.post('/check_event_rate', checkEventRating);



module.exports = router;
