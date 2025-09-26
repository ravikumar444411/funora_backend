const { body } = require("express-validator");
const mongoose = require("mongoose");

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

exports.createEventValidator = [
    body("eventTitle")
        .notEmpty().withMessage("Event title is required")
        .isLength({ min: 3 }).withMessage("Event title must be at least 3 characters long"),

    body("eventDescription")
        .notEmpty().withMessage("Event description is required"),

    body("eventCategory")
        .notEmpty().withMessage("Event category is required")
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage("Event category must be a valid ID"),

    body("organizerId")
        .notEmpty().withMessage("Organizer ID is required")
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage("Organizer ID must be a valid ID"),

    // Event Date From - required, must be yyyy-mm-dd
    body("eventDateFrom")
        .notEmpty().withMessage("Event start date is required")
        .isISO8601({ strict: true }).withMessage("Invalid event start date (use yyyy-mm-dd)"),

    // Event Date To - required, must be yyyy-mm-dd
    body("eventDateTo")
        .notEmpty().withMessage("Event end date is required")
        .isISO8601({ strict: true }).withMessage("Invalid event end date (use yyyy-mm-dd)"),

    // Event Time From - optional, must be HH:mm
    body("eventTimeFrom")
        .optional({ checkFalsy: true })
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage("Invalid event start time (use HH:mm)"),

    // Event Time To - optional, must be HH:mm
    body("eventTimeTo")
        .optional({ checkFalsy: true })
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage("Invalid event end time (use HH:mm)"),

    // Event Duration - optional but must be numeric if provided
    body("eventDuration")
        .optional({ checkFalsy: true })
        .isNumeric().withMessage("Event duration must be a number"),

    body("ticketPrice")
        .notEmpty()
        .isNumeric().withMessage("Ticket price must be a number"),

    body("eventGuidance")
        .notEmpty().withMessage("Event guidance is required")
        .isLength({ min: 10 }).withMessage("Event guidance must be at least 10 characters long"),


    // ✅ At least one image validation
    body().custom((_, { req }) => {
        if (
            (!req.files || !req.files.mainImage || req.files.mainImage.length === 0) &&
            (!req.files || !req.files.images || req.files.images.length === 0)
        ) {
            throw new Error("At least one image (mainImage or images) is required");
        }
        return true;
    }),
];
