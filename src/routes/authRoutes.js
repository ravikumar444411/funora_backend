const express = require("express");
const { sendOTP, verifyOTP } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const { registerUser, loginUser, getUser, deleteUser } = require("../controllers/authController");


const router = express.Router();

router.post("/send-otp", sendOTP); // Send OTP to phone number
router.post("/verify-otp", verifyOTP); // Verify OTP and return token

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:uid", getUser);
router.delete("/:uid", deleteUser);

// Protected route example
router.get("/protected", authMiddleware, (req, res) => {
    res.json({ success: true, message: "Access granted", user: req.user });
});

module.exports = router;
