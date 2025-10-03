const mongoose = require("mongoose");
const QRCode = require("qrcode");
const Cancellation = require("../../models/booking/cancellation.model");
const Booking = require("../../models/booking/booking.model");
const Charges = require("../../models/booking/charges.model");
const Event = require("../../models/event.model");
const User = require("../../models/user.model");
const { sendResponse } = require("../../utils/responseFormatter");
const { uploadQrToS3 } = require("../../utils/s3Upload");
const { v4: uuidv4 } = require("uuid");

// show summary before payment Booking Summary API
exports.getBookingSummary = async (req, res) => {
    try {
        const { userId, eventId, ticketQuantity, bookingDate } = req.body;

        // Validate input
        if (!userId || !eventId || !ticketQuantity || !bookingDate) {
            return sendResponse(res, false, [], "All required fields must be provided", 400);
        }

        // Fetch user details

        const user = await User.findOne({ _id: userId, status: "active" });
        if (!user) {
            return sendResponse(res, false, [], "User not found", 404);
        }

        // Fetch event details
        const event = await Event.findOne({ _id: eventId, isActive: true });
        if (!event) {
            return sendResponse(res, false, [], "Event not found", 404);
        }

        // Calculate subtotal
        const subtotal = event.ticketPrice * ticketQuantity;

        // Fetch active charges
        const chargeNames = ["GST", "Convenience_Fee"]; // add more if needed
        const chargesList = await Charges.find({ name: { $in: chargeNames }, active: true });
        let chargesAmount = {};

        chargesList.forEach((charge) => {
            if (charge.type === "percentage") {
                chargesAmount[charge.name] = parseFloat(((subtotal * charge.value) / 100).toFixed(2));
            } else {
                chargesAmount[charge.name] = charge.value;
            }
        });

        const totalCharges = Object.values(chargesAmount).reduce((a, b) => a + b, 0);
        const totalAmount = subtotal > 0 ? subtotal + totalCharges : subtotal;

        // Prepare response
        const bookingSummary = {
            eventId: event._id,
            eventName: event.eventTitle,
            eventDateFrom: event.eventDateFrom || null,
            eventDateTo: event.eventDateTo || null,
            eventTimeFrom: event.eventTimeFrom || null,
            eventTimeTo: event.eventTimeTo || null,
            eventVenue: event.eventVenue,
            bookingDate,
            pricePerTicket: event.ticketPrice,
            ticketQuantity,
            charges: chargesAmount,
            subtotal,
            totalAmount,
            userId: user._id,
            userFullame: user.fullName,
            userEmail: user.email,
            userphone: user.phone

        };

        return sendResponse(res, true, bookingSummary, "Booking summary generated successfully", 200);

    } catch (error) {
        console.log("Booking Summary Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};


// initiate booking before payment 
exports.initiateBooking = async (req, res) => {
    try {
        const { userId, eventId, tickets, bookingDate } = req.body;
        // tickets = { quantity: 2 }

        // Validate required fields
        if (!userId || !eventId || !tickets || !tickets.quantity || !bookingDate) {
            return sendResponse(res, false, [], "All required booking details must be provided", 400);
        }

        // Fetch event to get ticket price
        const event = await Event.findById(eventId);
        if (!event) {
            return sendResponse(res, false, [], "Event not found", 404);
        }

        const pricePerTicket = event.ticketPrice;
        const quantity = tickets.quantity;
        const subtotal = quantity * pricePerTicket;

        const chargeNames = ["GST", "Convenience_Fee"]; // add more if needed
        const chargesList = await Charges.find({ name: { $in: chargeNames }, active: true });

        let chargesAmount = {};

        // Calculate charges
        chargesList.forEach((charge) => {
            if (charge.type === "percentage") {
                chargesAmount[charge.name] = parseFloat(((subtotal * charge.value) / 100).toFixed(2));
            } else {
                chargesAmount[charge.name] = charge.value;
            }
        });

        // Calculate total amount
        const totalCharges = Object.values(chargesAmount).reduce((a, b) => a + b, 0);
        const totalAmount = subtotal + totalCharges;

        // Generate unique bookingCode
        const bookingCode = `BKNG_${Date.now()}_${uuidv4().slice(0, 6)}`;

        // Create booking document
        const newBooking = new Booking({
            bookingCode,
            userId,
            eventId,
            tickets: {
                quantity,
                pricePerTicket,
                subtotal,
            },
            charges: chargesAmount,
            totalAmount,
            bookingDate: new Date(bookingDate), // store as Date
            status: "pending",
        });

        await newBooking.save();

        return sendResponse(
            res,
            true,
            { bookingCode: newBooking.bookingCode, bookingId: newBooking._id, subtotal: subtotal, totalAmount: totalAmount },
            "Booking created successfully",
            201
        );

    } catch (error) {
        console.log("Create Booking Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};


//after payment book ticket
exports.finalizeBooking = async (req, res) => {
    try {
        const { bookingId, razorpay_payment_id, razorpay_payment_order_id } = req.body;

        if (!bookingId) {
            return sendResponse(res, false, [], "Booking id is required", 400);
        }

        const booking = await Booking.findOne({ _id: bookingId });
        if (!booking) {
            return sendResponse(res, false, [], "Booking not found", 404);
        }

        if (booking.status === "confirmed") {
            return sendResponse(res, false, { bookingId }, "Booking is already confirmed", 400);
        }

        // QR content (can just be bookingCode or detailed JSON)
        const qrText = JSON.stringify({
            bookingCode: booking.bookingCode,
            eventId: booking.eventId,
            userId: booking.userId,
            tickets: booking.tickets,
            totalAmount: booking.totalAmount
        });

        const qrBuffer = await QRCode.toBuffer(qrText);

        // Use uploadToS3 helper
        const fileKey = `qrcodes/${booking.bookingCode}_${Date.now()}.png`;
        const qrCodeUrl = await uploadQrToS3(qrBuffer, fileKey, "image/png");

        // Update booking
        booking.qrCodeUrl = qrCodeUrl;
        booking.status = "confirmed";
        booking.razorpay_payment_id = razorpay_payment_id ? razorpay_payment_id : null;
        booking.razorpay_payment_order_id = razorpay_payment_order_id ? razorpay_payment_order_id : null;
        await booking.save();

        return sendResponse(res, true, { bookingId }, "Booking finalized successfully", 200);
    } catch (error) {
        console.error("Finalize Booking Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};


// Booking Summary API
exports.confirmBookedSummary = async (req, res) => {
    try {
        const { bookingId } = req.body;

        if (!bookingId) {
            return sendResponse(res, false, [], "Booking ID is required", 400);
        }

        // Fetch booking and populate event & user info
        const booking = await Booking.findOne({
            _id: bookingId,
            status: { $in: ["confirmed", "partially_cancelled"] }
        }).populate("eventId")
            .populate("userId");

        if (!booking) {
            return sendResponse(res, false, [], "Booking not found or not booked yet", 404);
        }

        const event = booking.eventId;
        const user = booking.userId;


        // Format media
        const formattedMedia = event.media.map((url) => {
            const extension = url.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                return { type: "image", url };
            } else if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
                return { type: "video", url };
            }
            return { type: "unknown", url };
        });

        const imageMedia = formattedMedia.find((media) => media.type === "image");
        const bannerUrl = imageMedia ? imageMedia.url : "";

        const responseData = {
            bookingCode: booking.bookingCode,
            bookingStatus: booking.status,
            bookingDate: booking.bookingDate || booking.createdAt,
            ticketQuantity: booking.tickets.quantity,
            qrCodeUrl: booking.qrCodeUrl || null,
            razorpay_payment_id: booking.razorpay_payment_id || null,
            pricePerTicket: booking.tickets.pricePerTicket,
            totalAmount: booking.totalAmount,
            eventId: event._id,
            eventName: event.eventTitle,
            eventDateFrom: event.eventDateFrom,
            eventDateTo: event.eventDateTo,
            eventTimeFrom: event.eventTimeFrom,
            eventTimeTo: event.eventTimeTo,
            eventVenue: event.eventVenue,
            bannerUrl: bannerUrl,
            userId: user._id,
            userFullname: user.fullName,
            userEmail: user.email,
            userPhone: user.phone
        };

        return sendResponse(res, true, responseData, "Booking confirmed summary fetched successfully", 200);
    } catch (error) {
        console.log("Confirm Booked Summary Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

// Get All Booked Events of a User
exports.getMyBookings = async (req, res) => {
    try {
        const { userId } = req.body; // or from req.user if JWT auth is used

        if (!userId) {
            return sendResponse(res, false, [], "User ID is required", 400);
        }

        // Fetch all confirmed bookings of the user
        const bookings = await Booking.find({ userId, status: { $in: ["pending", "confirmed", "cancelled"] } })
            .populate("eventId")
            .populate("userId")
            .sort({ createdAt: -1 }); // latest first

        if (!bookings.length) {
            return sendResponse(res, true, [], "No bookings found", 200);
        }

        // Format booking list
        const formattedBookings = bookings.map((booking) => {
            const event = booking.eventId;
            const user = booking.userId;

            // Format event media
            const formattedMedia = event.media.map((url) => {
                const extension = url.split('.').pop().toLowerCase();
                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                    return { type: "image", url };
                } else if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
                    return { type: "video", url };
                }
                return { type: "unknown", url };
            });

            const imageMedia = formattedMedia.find((media) => media.type === "image");
            const bannerUrl = imageMedia ? imageMedia.url : "";

            return {
                bookingId: booking._id,
                bookingCode: booking.bookingCode,
                bookingStatus: booking.status,
                bookingDate: booking.bookingDate || booking.createdAt,
                ticketQuantity: booking.tickets.quantity,
                qrCodeUrl: booking.qrCodeUrl || null,
                razorpay_payment_id: booking.razorpay_payment_id || null,
                pricePerTicket: booking.tickets.pricePerTicket,
                totalAmount: booking.totalAmount,

                eventId: event._id,
                eventName: event.eventTitle,
                eventDateFrom: event.eventDateFrom,
                eventDateTo: event.eventDateTo,
                eventTimeFrom: event.eventTimeFrom,
                eventTimeTo: event.eventTimeTo,
                eventVenue: event.eventVenue,
                bannerUrl: bannerUrl,

                userId: user._id,
                userFullname: user.fullName,
                userEmail: user.email,
                userPhone: user.phone
            };
        });

        return sendResponse(res, true, formattedBookings, "Bookings fetched successfully", 200);
    } catch (error) {
        console.log("Get My Bookings Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

//cancellaton of ticket
exports.cancelTicket = async (req, res) => {
    try {
        const { userId, bookingId, numberOfTicketsToCancel, reason } = req.body;

        if (!userId || !bookingId || !numberOfTicketsToCancel || !reason) {
            return sendResponse(res, false, [], "All fields are required", 400);
        }

        // ✅ Fetch booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return sendResponse(res, false, [], "Booking not found", 404);
        }

        if (booking.userId.toString() !== userId) {
            return sendResponse(res, false, [], "Unauthorized cancellation attempt", 403);
        }

        // ✅ Calculate remaining tickets
        const bookedQuantity = booking.tickets.quantity;
        const alreadyCancelledTickets = await Cancellation.aggregate([
            { $match: { bookingId: booking._id } },
            { $group: { _id: null, total: { $sum: "$numberOfTicketsCancelled" } } },
        ]);

        const totalCancelled = alreadyCancelledTickets.length > 0 ? alreadyCancelledTickets[0].total : 0;
        const remainingTickets = bookedQuantity - totalCancelled;

        if (numberOfTicketsToCancel > remainingTickets) {
            return sendResponse(res, false, [], "Not enough active tickets to cancel", 400);
        }

        // ✅ Refund calculation
        const ticketPrice = booking.tickets.pricePerTicket;
        const subtotalToRefund = numberOfTicketsToCancel * ticketPrice;

        const cancellationChargeConfig = await Charges.findOne({
            name: "cancellation_fee",
            active: true,
        });

        let cancellationCharge = 0;
        if (cancellationChargeConfig) {
            if (cancellationChargeConfig.type === "percentage") {
                cancellationCharge = (subtotalToRefund * cancellationChargeConfig.value) / 100;
            } else {
                cancellationCharge = cancellationChargeConfig.value;
            }
        }

        const refundAmount = Math.max(subtotalToRefund - cancellationCharge, 0);

        // ✅ Insert Cancellation entry
        const cancellation = new Cancellation({
            bookingId: booking._id,
            cancelledBy: userId,
            numberOfTicketsCancelled: numberOfTicketsToCancel,
            reason,
            refundStatus: refundAmount > 0 ? "Pending" : "Not Applicable",
            refundAmount,
        });

        const savedCancellation = await cancellation.save();

        // ✅ Update Booking: status + active ticket quantity
        let newStatus = "partially_cancelled";
        let activeTickets = remainingTickets - numberOfTicketsToCancel;

        if (activeTickets === 0) {
            newStatus = "cancelled";
        }

        booking.status = newStatus;
        booking.tickets.quantity = activeTickets; // update active tickets
        await booking.save();

        return sendResponse(
            res,
            true,
            {
                cancellationId: savedCancellation._id,
                bookingId: booking._id,
                cancelledTickets: numberOfTicketsToCancel,
                refundAmount,
                newBookingStatus: newStatus,
                activeTickets: activeTickets,
            },
            "Tickets cancelled successfully",
            200
        );

    } catch (error) {
        console.error("Cancel Ticket Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};



