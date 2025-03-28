const express = require('express');
const { createOrganizer, updateOrganizer, getAllOrganizers, getOrganizerById } = require('../controllers/organizer.controller');
const router = express.Router();


// organizer api's
router.post('/create', createOrganizer);
router.put('/update/:id', updateOrganizer);
router.get('/', getAllOrganizers);
router.get('/:id', getOrganizerById);


module.exports = router;
