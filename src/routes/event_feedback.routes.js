const express = require('express');
const {
    postEventComment,
    getEventSummary,
    getAllCommentsByEventId
} = require('../controllers/event_feedback.controller');

const router = express.Router();

// Routes
router.post('/comment', postEventComment);                // Create or Update Attendee comment
router.post("/summary", getEventSummary); // API to fetch event summary
router.post("/all_comment", getAllCommentsByEventId); // API to fetch event summary

module.exports = router;
