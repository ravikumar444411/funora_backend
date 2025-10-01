const crypto = require("crypto");
const QRCode = require("qrcode");
const razorpayClient = require("../../config/razorpay");
const { sendResponse } = require("../../utils/responseFormatter");
const Booking = require("../../models/booking/booking.model");

// 🔹 Create Razorpay Order
exports.createOrder = async (req, res) => {
    try {
        const { amount, currency = "INR", receipt } = req.body;

        if (!amount) {
            return sendResponse(res, false, [], "Amount is required", 400);
        }

        const options = {
            amount: amount * 100, // paise
            currency,
            receipt: `rcpt_${receipt || Date.now()}`
        };

        const order = await razorpayClient.orders.create(options);

        return sendResponse(res, true, { order }, "Order created successfully", 200);
    } catch (err) {
        console.error("Create Order Error:", err);
        return sendResponse(res, false, [], "Failed to create order", 500);
    }
};

// 🔹 Verify Razorpay Payment Signature
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return sendResponse(res, false, [], "Missing payment details", 400);
        }

        const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            return sendResponse(res, true, { razorpay_order_id, razorpay_payment_id }, "Payment verified successfully", 200);
        } else {
            return sendResponse(res, false, [], "Invalid signature", 400);
        }
    } catch (err) {
        console.error("Verify Payment Error:", err);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

exports.webhookApi = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        const signature = req.headers["x-razorpay-signature"];
        const body = req.body.toString(); // JSON.stringify(req.body);

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");

        // 🔐 Verify webhook signature
        if (signature !== expectedSignature) {
            return sendResponse(res, false, [], "Invalid webhook signature", 400);
        }

        const event = req.body.event;

        if (event === "payment.captured") {
            const payment = req.body.payload.payment.entity;
            const { id: razorpay_payment_id, order_id: razorpay_payment_order_id, amount } = payment;

            // find booking based on Razorpay order id
            const booking = await Booking.findOne({ razorpay_payment_order_id });
            if (!booking) {
                return sendResponse(res, false, [], "Booking not found for order", 404);
            }

            if (booking.status === "confirmed") {
                return sendResponse(res, true, { bookingId: booking._id }, "Booking is already confirmed", 200);
            }

            // prepare QR content
            const qrText = JSON.stringify({
                bookingCode: booking.bookingCode,
                eventId: booking.eventId,
                userId: booking.userId,
                tickets: booking.tickets,
                totalAmount: booking.totalAmount
            });

            const qrBuffer = await QRCode.toBuffer(qrText);

            // upload QR to S3
            const fileKey = `qrcodes/${booking.bookingCode}_${Date.now()}.png`;
            const qrCodeUrl = await uploadQrToS3(qrBuffer, fileKey, "image/png");

            // update booking
            booking.qrCodeUrl = qrCodeUrl;
            booking.status = "confirmed";
            booking.razorpay_payment_id = razorpay_payment_id;
            booking.razorpay_payment_order_id = razorpay_payment_order_id;
            booking.amountPaid = amount / 100;
            booking.webhook = true
            await booking.save();

            return sendResponse(res, true, { bookingId: booking._id }, "Booking confirmed via webhook", 200);
        }

        // If event is something else, just acknowledge
        return sendResponse(res, true, [], `Unhandled event: ${event}`, 200);

    } catch (error) {
        console.error("Webhook Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};