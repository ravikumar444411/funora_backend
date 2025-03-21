const express = require('express');
const { createEvent, getEvents, getEventById, updateEvent, deleteEvent } = require('../controllers/event.controller');

const upload = require("../config/multer");
const { getFilteredEvents } = require('../controllers/filterEvent.controller');
const router = express.Router();


//filter & search
router.get('/filter', getFilteredEvents);          // Get search & filter Events


// Routes
router.post("/create", upload.array("images"), createEvent);
router.post('/', createEvent);       // Create an Event
router.get('/', getEvents);          // Get All Events
router.get('/:id', getEventById);    // Get Event by ID
router.put('/:id', upload.array("images"), updateEvent);     // Update an Event
router.delete('/:id', deleteEvent);  // Delete an Event


module.exports = router;
