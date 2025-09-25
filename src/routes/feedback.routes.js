const express = require('express');
const upload = require("../config/multer");
const {
    submitFeedback
} = require('../controllers/feedback.controller');

const router = express.Router();

router.post('/submit', upload.array("files", 5), submitFeedback);

module.exports = router;
