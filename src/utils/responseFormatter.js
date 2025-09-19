const sendResponse = (res, success, data = [], message = "Success", status = 200) => {
    return res.status(status).json({
        success,
        message,
        data
    });
};

const formatUserResponse = (user) => {
    return {
        _id: user?._id ?? null,
        fullName: user?.fullName ?? user?.name ?? null,
        email: user?.email ?? null,
        phone: user?.phone ?? null,
        profilePicture: user?.profilePicture ?? null,
        dob: user?.dob ?? null,
        role: user?.role ?? "user",
        location: user?.location ?? null,
        preferences: {
            theme: user?.preferences?.theme ?? "light",
            language: user?.preferences?.language ?? "en"
        }
    };
};


const formatEventResponse = (event) => {
    const parseTime = (timeStr, baseDate) => {
        if (!timeStr) return null;

        const parsed = Date.parse(timeStr);
        if (!isNaN(parsed)) return new Date(parsed);

        const match = timeStr.match(/(\d+):(\d+)\s?(AM|PM)?/i);
        if (match) {
            let hours = parseInt(match[1], 10);
            const minutes = parseInt(match[2], 10);
            const isPM = match[3]?.toUpperCase() === "PM";
            if (isPM && hours < 12) hours += 12;
            if (!isPM && hours === 12) hours = 0;

            const d = new Date(baseDate);
            d.setHours(hours, minutes, 0, 0);
            return d;
        }

        return null;
    };

    const eventDateFrom = event.eventDateFrom;
    const eventDateTo = event.eventDateTo;

    const baseFrom = new Date(eventDateFrom);
    const baseTo = new Date(eventDateTo);

    const timeFrom = parseTime(event?.eventTimeFrom, baseFrom)
        ?? new Date(baseFrom.setHours(10, 0, 0, 0)); // Default 10:00 AM
    const timeTo = parseTime(event?.eventTimeTo, baseTo)
        ?? new Date(baseTo.setHours(18, 0, 0, 0)); // Default 6:00 PM

    return {
        _id: event?._id ?? null,
        eventTitle: event?.eventTitle ?? null,
        eventDescription: event?.eventDescription ?? null,
        organizerId: event?.organizerId ?? null,

        eventDateFrom,
        eventDateTo,
        eventTimeFrom: timeFrom ? timeFrom.toISOString() : null,
        eventTimeTo: timeTo ? timeTo.toISOString() : null,
        eventDuration: getEventDuration(event),
        eventVenue: event?.eventVenue ?? "",
        isPublic: event?.isPublic ?? true,
        media: event?.media ?? [],
        ticketPrice: event?.ticketPrice ?? 0,
        isOnline: event?.isOnline ?? false,
        eventGuidance: event?.eventGuidance ?? "",
    };
};

// Helper function
function getEventDuration(event) {
    // 1️⃣ Case: Explicit eventDuration field
    if (event?.eventDuration && event.eventDuration > 0) {
        return formatDuration(event.eventDuration);
    }

    // 2️⃣ Case: Derive from eventTimeFrom & eventTimeTo
    if (event?.eventTimeFrom && event?.eventTimeTo) {
        const from = new Date(event.eventTimeFrom);
        const to = new Date(event.eventTimeTo);

        if (!isNaN(from) && !isNaN(to) && to > from) {
            const diffMinutes = Math.floor((to - from) / (1000 * 60));
            return formatDuration(diffMinutes);
        }
    }

    // 3️⃣ Fallback: No info
    return "Flexible timing";
}

// Format helper: minutes → hours/mins
function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} min${minutes > 1 ? "s" : ""}`;
    }
    const hours = Math.ceil(minutes / 60);
    return `${hours} hr${hours > 1 ? "s" : ""}`;
}

const formatCategoryResponse = (category) => {
    return {
        _id: category._id,
        categoryName: category.categoryName,
        categoryType: category.categoryType,
        categoryImage: category.categoryImage || "",
    };
};

const formatPreferencesResponse = (preference) => {
    return {
        userId: preference?.userId ?? null,
        theme: preference?.theme ?? "light",
        eventCategories: preference?.eventCategories ?? [],
        locationPreference: preference?.locationPreference ?? null,
        eventType: preference?.eventType ?? "In-Person",
        budget: preference?.budget ?? "Paid",
        timeFrame: preference?.timeFrame ?? "Today",
        fromDate: preference?.timeFrame === "Custom" ? preference?.fromDate ?? null : null,
        toDate: preference?.timeFrame === "Custom" ? preference?.toDate ?? null : null,
        timeOfDay: preference?.timeOfDay ?? [],
        fromTime: preference?.timeOfDay?.includes("Custom") ? preference?.fromTime ?? null : null,
        toTime: preference?.timeOfDay?.includes("Custom") ? preference?.toTime ?? null : null,
        priceRange: {
            min: preference?.priceRange?.min ?? 0,
            max: preference?.priceRange?.max ?? 1000
        },
    };
};


const formatFavoriteEventResponse = (favoriteEvent) => {
    return {
        _id: favoriteEvent?._id ?? null,
        eventTitle: favoriteEvent?.eventTitle ?? null,
        eventDescription: favoriteEvent?.eventDescription ?? null,
        organizerId: favoriteEvent?.organizerId ?? null, // Added organizerId
        eventDateFrom: favoriteEvent?.eventDateFrom ?? null,
        eventDateTo: favoriteEvent?.eventDateTo ?? null,
        eventTimeFrom: favoriteEvent?.eventTimeFrom ?? null,
        eventTimeTo: favoriteEvent?.eventTimeTo ?? null,
        eventDuration: favoriteEvent?.eventDuration ?? null,
        eventVenue: favoriteEvent?.eventVenue ?? null,
        isPublic: favoriteEvent?.isPublic ?? true,
        ticketPrice: favoriteEvent?.ticketPrice ?? 0,
        isOnline: favoriteEvent?.isOnline ?? false,
        isFavorite: favoriteEvent?.isFavorite ?? false,
    };
};


const formatOrganizerResponse = (organizer) => {
    return {
        organizerId: organizer?._id ?? null,
        name: organizer?.name ?? "Unknown Organizer",
        phone: organizer?.phone ?? null,
        profilePicture: organizer?.profilePicture ?? null,
        description: organizer?.description ?? "No description available",
        website: organizer?.website ?? null,
        socialLinks: {
            facebook: organizer?.socialLinks?.facebook ?? null,
            twitter: organizer?.socialLinks?.twitter ?? null,
            instagram: organizer?.socialLinks?.instagram ?? null
        }
    };
};


const formatAttendeeResponse = (attendee) => {
    return {
        id: attendee._id,
        eventId: attendee.eventId,
        userId: attendee.userId,
        status: attendee.status,
    };
};

const formatFeedbackResponse = (feedback) => {
    return {
        id: feedback._id,
        eventId: feedback.eventId,
        userId: feedback.userId,
        comment: feedback.comment,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt
    };
};


const formatPopularEventResponse = (event) => {
    return {
        _id: event?._id ?? null,
        eventTitle: event?.eventTitle ?? null,
        eventDescription: event?.eventDescription ?? null,
        eventDateFrom: event?.eventDateFrom ?? null,
        eventDateTo: event?.eventDateTo ?? null,
        eventTimeFrom: event?.eventTimeFrom ?? null,
        eventTimeTo: event?.eventTimeTo ?? null,
        eventDuration: event?.eventDuration ?? null,
        eventVenue: event?.eventVenue ?? null,
        ticketPrice: event?.ticketPrice ?? 0,
    };
};


const formatRecommendedEventResponse = (event) => {
    return {
        _id: event?._id ?? null,
        eventTitle: event?.eventTitle ?? null,
        eventDescription: event?.eventDescription ?? null,
        organizerId: event?.organizerId ?? null, // Added organizerId
        eventDateFrom: event?.eventDateFrom ?? null,
        eventDateTo: event?.eventDateTo ?? null,
        eventTimeFrom: event?.eventTimeFrom ?? null,
        eventTimeTo: event?.eventTimeTo ?? null,
        eventDuration: event?.eventDuration ?? null,
        eventVenue: event?.eventVenue ?? null,
        ticketPrice: event?.ticketPrice ?? 0,
    };
};


module.exports = {
    formatUserResponse, formatFeedbackResponse, formatAttendeeResponse, formatEventResponse, sendResponse,
    formatPreferencesResponse, formatFavoriteEventResponse, formatCategoryResponse, formatOrganizerResponse, formatPopularEventResponse,
    formatRecommendedEventResponse
};
