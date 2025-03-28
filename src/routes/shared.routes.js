const express = require('express');
const { shareEvent, getSharedEventByEventId, getSharedEventByUserId } = require('../controllers/shared_event.controller');
const router = express.Router();


// save to favorite
router.post('/share', shareEvent);
router.get('/event/:eventId', getSharedEventByEventId);
router.get('/user/:userId', getSharedEventByUserId);


module.exports = router;
