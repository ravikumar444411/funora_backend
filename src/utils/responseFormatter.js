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
        eventCategory: event?.eventCategory ?? null,
        eventDateFrom: event?.eventDateFrom ?? null,
        eventDateTo: event?.eventDateTo ?? null,
        eventTimeFrom: event?.eventTimeFrom ?? null,
        eventTimeTo: event?.eventTimeTo ?? null,
        eventDuration: event?.eventDuration ?? null,
        eventVenue: event?.eventVenue ?? null,
        isPublic: event?.isPublic ?? null,
        images: event?.images ?? null
    };
};

const formatCategoryResponse = (category) => {
    return {
        _id: category._id,
        categoryName: category.categoryName,
        categoryImage: category.categoryImage || "",
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
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
        createdAt: preference?.createdAt ?? null,
        updatedAt: preference?.updatedAt ?? null
    };
};


module.exports = { formatEventResponse, sendResponse, formatCategoryResponse, formatUserResponse, formatPreferencesResponse };
