const express = require('express');
const {
    createAttendee,
    getAttendeeStatus,
} = require('../controllers/attendee.controller');

const router = express.Router();

// Routes
router.post('/create', createAttendee);                // Create or Update Attendee Status
router.post('/single_attendee', getAttendeeStatus); // Get Attendees by Event ID & userid

module.exports = router;
