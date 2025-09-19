const express = require('express');
const { createEvent, getEvents, getEventById, updateEvent, deleteEvent, getPopularEvents, getRecommendedEvents } = require('../controllers/event.controller');

const upload = require("../config/multer");
const { getFilteredEvents } = require('../controllers/filterEvent.controller');
const router = express.Router();


//filter & search
router.post('/filter', getFilteredEvents);          // Get search & filter Events


// Routes
router.post("/create",
    upload.fields([
        { name: "mainImage", maxCount: 1 }, // single
        { name: "images", maxCount: 10 },   // multiple
    ]),
    createEvent
);

router.post('/', createEvent);       // Create an Event
router.get('/', getEvents);          // Get All Events
router.post('/single_event', getEventById);    // Get Event by ID
router.put('/:id', upload.array("images"), updateEvent);     // Update an Event
router.delete('/:id', deleteEvent);  // Delete an Event


//popular event
router.post('/popular_event', getPopularEvents);
router.post('/recommended_event', getRecommendedEvents);



module.exports = router;
