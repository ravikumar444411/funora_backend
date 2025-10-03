const mongoose = require("mongoose");

const cancellationSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true,
    },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // who cancelled (user/admin/system)
        required: true,
    },
    cancelledAt: {
        type: Date,
        default: Date.now,
    },
    numberOfTicketsCancelled: {
        type: Number,
        required: true,
        min: 1,
    },
    reason: {
        type: String, // ✅ free text reason
        required: true,
    },
    refundStatus: {
        type: String,
        enum: ["Not Applicable", "Pending", "Processed", "Failed"],
        default: "Pending",
    },
    refundAmount: {
        type: Number,
        default: 0,
    },
    notes: {
        type: String, // extra details (optional)
    },
});



module.exports = mongoose.model("Cancellation", cancellationSchema);
