const express = require("express");
const { sendOTP, verifyOTP, registerUser, loginUser, getUser, deleteUser,
    checkByphone, loginNew, verifyToken, registerNew, sendOtpToMobile, loginOrRegisterWithMobile,
    verifyOtpWithMobile, completeUserProfile } = require("../controllers/auth.controller");
const { authMiddleware } = require("../middlewares/authMiddleware");


const router = express.Router();

router.post("/send_otp", sendOtpToMobile);
router.post("/login_with_mobile", loginOrRegisterWithMobile);
router.post("/verify_otp", verifyOtpWithMobile);
router.post("/complete_profile", completeUserProfile);




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



//New auth methods
router.post("/check_phone_number", checkByphone);
router.post("/login_new", loginNew);
router.post("/verify_token", verifyToken);
router.post("/register_new", registerNew);

module.exports = router;
