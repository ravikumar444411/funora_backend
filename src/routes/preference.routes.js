const express = require("express");
const router = express.Router();
const preferenceController = require("../controllers/preference.controller");

// Create or Update Preferences
router.post("/", preferenceController.upsertPreferences);

// Get Preferences by User ID
router.get("/:userId", preferenceController.getPreferencesByUserId);

// Delete Preferences by User ID
router.delete("/:userId", preferenceController.deletePreferences);

module.exports = router;
