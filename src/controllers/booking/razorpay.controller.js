const razorpayClient = require("../../config/razorpay");

exports.createOrder = async (req, res) => {
    try {
        const { amount, currency = "INR", receipt } = req.body;

        const options = {
            amount: amount * 100, // Razorpay takes amount in paise
            currency,
            receipt: `rcpt_${receipt || Date.now()}`
        };

        const order = await razorpayClient.orders.create(options);
        res.json({ success: true, order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};


exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");

    if (razorpay_signature === expectedSign) {
        res.json({ success: true, message: "Payment verified successfully" });
    } else {
        res.status(400).json({ success: false, message: "Invalid signature" });
    }
};