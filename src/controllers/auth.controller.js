// import axios from "axios";
const axios = require("axios");
const admin = require("../config/firebaseAdmin");
const User = require("../models/user.model");
const { sendResponse } = require("../utils/responseFormatter");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateToken, verifyToken, verifyAndDecodeToken } = require("../utils/tokenService");
const OtpModel = require("../models/otp.model");
const sgMail = require('@sendgrid/mail');


sgMail.setApiKey(process.env.SENDGRID_API_KEY); // store key in env variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;
const client = require("twilio")(accountSid, authToken);


const FAST2SMS_KEY = process.env.FAST2SMS_KEY;

//API to login and encode token
exports.loginNew = async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Validate input
        if (!phone || !password) {
            return res.status(400).json({ success: false, message: "Phone and password are required" });
        }

        // Check if user exists
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Generate token (ensuring it's handled as a promise)
        const token = await generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// API to verify and decode token
exports.verifyToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: "Token is required" });
        }

        const result = await verifyAndDecodeToken(token);
        if (!result.success) {
            return res.status(401).json({ success: false, message: result.message });
        }

        return res.status(200).json({ success: true, message: "Token verified successfully", data: result.data });
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

//API to register and encode token
exports.registerNew = async (req, res) => {
    try {
        const { phone, password, fullName } = req.body;

        // Validate input
        if (!phone || !password || !fullName) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Phone number already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user and save
        const newUser = new User({
            phone,
            password: hashedPassword,
            fullName,
        });
        await newUser.save();

        // Retrieve user data after saving (excluding password)
        const savedUser = await User.findOne({ phone }).select("-password");

        // Generate token with full user data
        const token = await generateToken(savedUser);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


// login api check if user is register or not
exports.checkByphone = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return sendResponse(res, false, [], "Phone number is required", 400);
        }

        const user = await User.findOne({ phone, status: 'active' });

        if (user) {
            return sendResponse(res, true, { isRegistered: true }, "User is registered", 200);
        } else {
            return sendResponse(res, true, { isRegistered: false }, "User is not registered", 200);
        }

    } catch (error) {
        console.error("Login Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

exports.sendOTP = async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    try {
        const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
        console.log("show user record ====", userRecord)
        return res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        if (error.code === "auth/user-not-found") {
            // If user doesn't exist, create one
            const userRecord = await admin.auth().createUser({ phoneNumber });
            return res.json({ success: true, message: "User created, OTP sent" });
        }
        return res.status(500).json({ success: false, message: "Error sending OTP", error });
    }
};

exports.verifyOTP = async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ success: false, message: "OTP token is required" });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return res.json({ success: true, message: "OTP Verified", user: decodedToken });
    } catch (error) {
        console.log("getting this Error:", error);
        return res.status(400).json({ success: false, message: "Invalid OTP", error });
    }
};


exports.registerUser = async (req, res) => {
    try {
        const { email, password, fullName } = req.body;

        if (!email || !password) {
            return sendResponse(res, false, [], "Email and password are required", 400);
        }

        // Create user in Firebase Authentication
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: fullName,
        });

        return sendResponse(res, true, { uid: userRecord.uid, email: userRecord.email }, "User registered successfully", 201);
    } catch (error) {
        console.log("getting this Error:", error);
        return sendResponse(res, false, [], error.message, 500);
    }
};




exports.getUser = async (req, res) => {
    try {
        const { uid } = req.params;

        const userRecord = await admin.auth().getUser(uid);

        return sendResponse(res, true, userRecord, "User retrieved successfully", 200);
    } catch (error) {
        console.log("getting this Error:", error);
        return sendResponse(res, false, [], error.message, 500);
    }
};


exports.deleteUser = async (req, res) => {
    try {
        const { uid } = req.params;

        await admin.auth().deleteUser(uid);

        return sendResponse(res, true, [], "User deleted successfully", 200);
    } catch (error) {
        console.log("getting this Error:", error);
        return sendResponse(res, false, [], error.message, 500);
    }
};



exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendResponse(res, false, [], "Email and password are required", 400);
        }

        // Firebase does NOT support direct password verification in Admin SDK.
        // Instead, generate a custom token and verify it on the frontend.
        const user = await admin.auth().getUserByEmail(email);

        const token = await admin.auth().createCustomToken(user.uid);

        return sendResponse(res, true, { token }, "Login successful", 200);
    } catch (error) {
        return sendResponse(res, false, [], error.message, 500);
    }
};

/* this is new section of login and otp */
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit

exports.sendOtpToMobile = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return sendResponse(res, false, [], "Phone number is required", 400);
        }

        const otpCode = generateOtp(); // 6-digit OTP
        console.log("Your OTP is:", otpCode);

        // Optionally send SMS via Twilio (uncomment if using production)
        await client.messages.create({
            body: `Hey there! Your Funora OTP is ${otpCode}. It’s valid for 5 minutes. 🚀`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone,
        });

        // Create or update OTP record
        const updatedOtp = await OtpModel.findOneAndUpdate(
            { phone }, // condition
            {
                phone,
                otpCode,
                status: "pending",
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 1 * 60 * 1000),
            },
            {
                upsert: true, // create if not exists
                new: true,    // return the updated doc
                setDefaultsOnInsert: true,
            }
        );

        return sendResponse(res, true, { phone }, "OTP sent successfully", 200);
    } catch (error) {
        console.error("Error sending OTP:", error);
        return sendResponse(res, false, [], "Failed to send OTP", 500);
    }
};


// exports.loginOrRegisterWithMobile = async (req, res) => {
//     try {
//         const { phone } = req.body;

//         // Validate input
//         if (!phone) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Phone number is required",
//             });
//         }

//         // Check if user already exists
//         let user = await User.findOne({ phone });


//         if (!user) {
//             // Create new user with default fields
//             const defaultPassword = await bcrypt.hash("Funora@123", 10);
//             user = new User({
//                 fullName: "Funora Explorer 🎉",
//                 password: defaultPassword,
//                 phone,
//                 email: `user${Date.now()}@funora.app`, // unique placeholder email
//                 dob: new Date("2000-01-01"), // default DOB for new users
//                 signup: false,
//                 createdAt: new Date(),
//             });
//             await user.save();
//         }

//         // Optionally: Generate token or session here if needed
//         return res.status(200).json({
//             success: true,
//             message: "User login/registration successful",
//             user: {
//                 id: user._id,
//                 phone: user.phone,
//             },
//         });
//     } catch (error) {
//         console.error("Login/Register error:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//         });
//     }
// };

exports.verifyOtpWithMobile = async (req, res) => {
    try {
        const { phone, otpCode } = req.body;

        if (!phone || !otpCode) {
            return sendResponse(res, true, { verified: false, isSignup: false, token: "" }, "Phone and OTP are required", 200);
        }

        const otpRecord = await OtpModel.findOne({ phone });

        // If OTP not found (expired or deleted)
        if (!otpRecord) {
            return sendResponse(res, true, { verified: false, isSignup: false, token: "" }, "OTP expired or not found", 200);
        }

        // If OTP doesn't match
        if (otpRecord.otpCode !== otpCode) {
            return sendResponse(res, true, { verified: false, isSignup: false, token: "" }, "Invalid OTP", 200);
        }

        // OTP is valid
        otpRecord.status = "verified";
        await otpRecord.save();

        // Check if user exists and read signup field
        const user = await User.findOne({ phone });
        const isSignup = user?.signup === true;

        let token = "";
        if (isSignup && user) {
            token = await generateToken(user); // generate JWT token
        }

        return sendResponse(res, true, {
            verified: true,
            isSignup,
            userId: user._id,
            token
        }, "OTP verified successfully", 200);

    } catch (error) {
        console.error("Error verifying OTP:", error);
        return sendResponse(res, false, { verified: false, isSignup: false, token: "" }, "Failed to verify OTP", 500);
    }
};

exports.completeUserProfile = async (req, res) => {
    try {
        const { phone, fullName, dob, email } = req.body;

        // Validate input
        if (!phone || !fullName || !dob || !email) {
            return res.status(400).json({
                success: false,
                message: "Phone, full name, and date of birth are required",
            });
        }

        // Check if user exists
        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Update user profile
        user.fullName = fullName;
        user.email = email;
        user.dob = new Date(dob);
        user.signup = true;

        await user.save();

        // Generate token
        const token = await generateToken(user);

        return res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            userId: user._id,
            token
        });
    } catch (error) {
        console.error("Error updating user profile:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.loginOrRegisterWithMobile = async (req, res) => {
    try {
        const { phone } = req.body;
        let resData = { phone };

        // Validate input
        if (!phone) {
            return sendResponse(res, false, [], "Phone number is required", 400);
        }

        // Step 1: Check if user already exists
        let user = await User.findOne({ phone });

        if (!user) {
            // Create new user with default values
            const defaultPassword = await bcrypt.hash("Funora@123", 10);
            user = new User({
                fullName: "Funora Explorer 🎉",
                password: defaultPassword,
                phone,
                email: `user${Date.now()}@funora.app`,
                dob: new Date("2000-01-01"),
                signup: false,
                createdAt: new Date(),
            });
            await user.save();
        }

        // Step 2: Generate OTP
        const otpCode = generateOtp(); // 6-digit OTP
        console.log("Generated OTP:", otpCode);


        if (true) {
            // Optional: Send SMS with OTP via Twilio
            await client.messages.create({
                body: `Hey there! Your Funora OTP is ${otpCode}. It’s valid for 1 minute. 🚀`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone,
            });

            //send OTP with whatsapp via twillio
            // try {
            //     const message = await client.messages.create({
            //         from: "whatsapp:+14155238886",
            //         to: `whatsapp:${phone}`,
            //         body: `Hey there! Your Funora OTP is ${otpCode}. It’s valid for 1 minute. 🚀`,
            //     });
            //     console.log("WhatsApp Message SID:", message.sid, message);
            // } catch (err) {
            //     console.error("Twilio WhatsApp Error:", err);
            // }


            resData.otpCode = otpCode
        } else {
            resData.otpCode = otpCode;
        }


        // Step 3: Store OTP in DB (create or update)
        await OtpModel.findOneAndUpdate(
            { phone },
            {
                phone,
                otpCode,
                status: "pending",
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // expires in 1 min
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        );

        // Step 4: Respond back with basic user info (do not send OTP in prod)
        return sendResponse(res, true, resData, "OTP sent successfully", 200);
    } catch (error) {
        console.error("Login/Register error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};



// Check if phone is registered
exports.checkUser = async (req, res) => {
    try {
        const { phone } = req.body;
        let resData = { phone };

        // Validate input
        if (!phone) {
            return sendResponse(res, false, [], "Phone number required", 400);
        }

        // Check user
        const user = await User.findOne({ phone });

        if (!user) {
            resData.isRegistered = false;
            return sendResponse(res, true, resData, "User not registered", 200);
        }

        resData.isRegistered = true;
        resData.user = {
            id: user._id,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            status: user.status
        };

        return sendResponse(res, true, resData, "User already registered", 200);

    } catch (error) {
        console.error("Check user error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

exports.loginWithPin = async (req, res) => {
    try {
        const { phone, login_pin } = req.body;
        let resData = { phone };

        if (!phone || !login_pin) {
            return sendResponse(res, false, [], "Phone and PIN are required", 400);
        }

        const user = await User.findOne({ phone });

        if (!user) {
            resData.isRegistered = false;
            return sendResponse(res, false, resData, "User not registered", 404);
        }

        resData.isRegistered = true;

        // Compare PIN (store hashed PIN in DB)
        const isMatch = await bcrypt.compare(login_pin, user.login_pin);
        if (!isMatch) {
            return sendResponse(res, false, [], "Invalid PIN", 401);
        }


        resData.token = await generateToken(user); // generate JWT token

        // Success
        resData.user = {
            id: user._id,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            status: user.status,
        };

        return sendResponse(res, true, resData, "Login successful with PIN", 200);

    } catch (error) {
        console.error("Login with PIN error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

exports.registerUserWithPin = async (req, res) => {
    try {
        const { phone, pin, confirm_pin } = req.body;
        let resData = { phone };

        if (!phone || !pin || !confirm_pin) {
            return sendResponse(res, false, [], "Phone, PIN and Confirm PIN are required", 400);
        }

        if (pin !== confirm_pin) {
            return sendResponse(res, false, [], "PIN and Confirm PIN do not match", 400);
        }

        // Check if user already exists
        let user = await User.findOne({ phone });
        if (user) {
            return sendResponse(res, false, [], "User already registered", 400);
        }

        // Create new user
        const defaultPassword = await bcrypt.hash("Funora@123", 10);
        const hashedPin = await bcrypt.hash(pin, 10);

        user = new User({
            fullName: "Funora Explorer 🎉",
            password: defaultPassword,
            phone,
            email: `user${Date.now()}@funora.app`,
            dob: new Date("2000-01-01"),
            signup: false,
            createdAt: new Date(),
            login_pin: hashedPin
        });

        await user.save();



        resData.token = await generateToken(user); // generate JWT token

        resData.user = {
            id: user._id,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            status: user.status,
        };

        return sendResponse(res, true, resData, "User registered successfully", 201);

    } catch (error) {
        console.error("Register user error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

exports.sendEmailOtp = async (req, res) => {
    try {
        const { userEmail } = req.body;
        if (!userEmail) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const otp = generateOtp();

        const msg = {
            to: userEmail,
            from: 'ravikumar444452@gmail.com', // verified sender
            subject: 'Your Funora OTP Code',
            text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
            html: `<p>Your OTP code is <strong>${otp}</strong>. It will expire in 5 minutes.</p>`,
        };

        await sgMail.send(msg);
        console.log(`OTP sent successfully to ${userEmail}`);

        // Optionally: store OTP in DB or cache (Redis) with expiry
        // await saveOtp(userEmail, otp);

        return res.status(200).json({
            success: true,
            data: { otp }, // only for testing, remove OTP in production
            message: "OTP sent successfully",
        });

    } catch (error) {
        console.error("❌ Email sending failed:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send OTP",
        });
    }
};