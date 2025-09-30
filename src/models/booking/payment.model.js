const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
        },
        razorpay: {
            orderId: { type: String, required: true },   // from razorpay.orders.create
            paymentId: { type: String },                 // filled after payment success
            signature: { type: String },                 // for verification
        },
        amount: {
            type: Number,
            required: true, // in paise
        },
        currency: {
            type: String,
            default: "INR",
        },
        method: {
            type: String, // UPI, Card, Wallet, NetBanking
        },
        status: {
            type: String,
            enum: ["created", "pending", "success", "failed", "refunded"],
            default: "created",
        },
        paidAt: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
