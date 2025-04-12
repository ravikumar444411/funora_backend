const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true
    },
    otpCode: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'expired'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // expires: 300 // TTL - Document will auto-delete after 300 seconds (5 minutes)
    }
}, { timestamps: true });

const OtpModel = mongoose.model('Otp', otpSchema);
module.exports = OtpModel;
