const express = require("express");
const { checkUser, completeUserProfile } = require("../controllers/login.controller");
const { authMiddleware } = require("../middlewares/authMiddleware");


const router = express.Router();

router.post("/checkUser", checkUser);
router.post("/complete_profile", completeUserProfile);

module.exports = router;
