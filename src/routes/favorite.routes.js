const express = require('express');
const { favoriteEventSave, getFavoriteEvents } = require('../controllers/favoriteEvent.controller');

const router = express.Router();


// save to favorite
router.post('/save', favoriteEventSave);
router.post('/fetch', getFavoriteEvents);


module.exports = router;
