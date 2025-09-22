const express = require('express');
const {
    updateAppConfig
} = require('../controllers/appConfig.controller');

const router = express.Router();

router.post('/', updateAppConfig);

module.exports = router;
