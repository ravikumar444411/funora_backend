const express = require('express');
const {
    getAllLocationsFromFile,
    updateUserLocation
} = require('../controllers/location.controller');

const router = express.Router();

router.get('/fetch-all', getAllLocationsFromFile);
router.post('/update', updateUserLocation);

module.exports = router;
