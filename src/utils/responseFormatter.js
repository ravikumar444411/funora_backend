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
        location: {
            city: user?.location?.city ?? null,
        },
        preferences: {
            theme: user?.preferences?.theme ?? "light",
            language: user?.preferences?.language ?? "en"
        }
    };
};


const formatEventResponse = (event) => {
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
        isPublic: event?.isPublic ?? true,
        media: event?.media ?? [],
        ticketPrice: event?.ticketPrice ?? 0,
        isOnline: event?.isOnline ?? false,
    };
};

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
        eventId: favoriteEvent?.eventId ?? null,
        userId: favoriteEvent?.userId ?? null,
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
