const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        bookingCode: {
            type: String,
            required: true,
            unique: true, // custom reference, e.g., BKNG12345
        },
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tickets: {
            quantity: { type: Number, required: true },
            pricePerTicket: { type: Number, required: true },
            subtotal: { type: Number, required: true }, // qty * price
        },
        charges: {
            tax: { type: Number, default: 0 },
            convenienceFee: { type: Number, default: 0 },
            discount: { type: Number, default: 0 },
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "not_initiate"],
            default: "pending",
        },
        qrCodeUrl: {
            type: String,
        },
        razorpay_payment_id: {
            type: String,
        },
        bookingDate: { type: Date, },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
