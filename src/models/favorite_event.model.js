const mongoose = require('mongoose');

const favoriteEventSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isFavorite: { type: Boolean, default: false },
    remindMe: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const FavoriteEvent = mongoose.model('Favorite_event', favoriteEventSchema);
module.exports = FavoriteEvent;