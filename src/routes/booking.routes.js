const express = require('express');
const {
    generateQRCode,
    generateQRCodeFile
} = require('../controllers/booking/ticket.controller');
const {
    getBookingSummary,
    initiateBooking,
    finalizeBooking,
    confirmBookedSummary,
    getMyBookings,
    cancelTicket
} = require('../controllers/booking/booking.controller');
const {
    createOrder,
    verifyPayment,
    webhookApi
} = require('../controllers/booking/razorpay.controller');

const router = express.Router();

router.post('/generate_qr_code', generateQRCode);
router.post('/generate_qr_code_file', generateQRCodeFile);



//booking controller
router.post('/get_booking_summary', getBookingSummary); //step 1
router.post('/initiate_booking', initiateBooking); //step 2
router.post('/finalize_booking', finalizeBooking); //step 3
router.post('/confirm_booked_summary', confirmBookedSummary); //step 4
router.post('/my_bookings', getMyBookings);
router.post('/cancel_booking', cancelTicket);


//razorpay intigration
router.post('/create-order', createOrder); //step 4
router.post('/verify-payment', verifyPayment); //step 4
router.post('/webhook', webhookApi); //step 4


module.exports = router;
