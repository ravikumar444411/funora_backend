const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/user.routes");
const uploadRoutes = require("./routes/uploadRoutes");
const eventRoutes = require('./routes/event.routes');
const categoryRoutes = require('./routes/category.routes');
const preferencesRoutes = require('./routes/preference.routes');
const authRoutes = require("./routes/auth.routes");
const favoriteRoutes = require("./routes/favorite.routes");
const organizerRoutes = require("./routes/organizer.routes");
const sharedRoutes = require("./routes/shared.routes");
const attendeeRoutes = require("./routes/attendee.routes");
const eventFeedbackRoutes = require("./routes/event_feedback.routes");
const fileUploadRoutes = require("./routes/file_upload.routes");


require("dotenv").config();

const app = express();
app.use(express.json()); // Middleware to parse JSON

// Connect to MongoDB
connectDB();

// Routes
app.use("/api", uploadRoutes);
app.use("/api", userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/favorite", favoriteRoutes);
app.use("/api/organizer", organizerRoutes);
app.use("/api/shared_event", sharedRoutes);
app.use("/api/attendee", attendeeRoutes);
app.use("/api/feedback", eventFeedbackRoutes);


// to upload file
app.use("/file_upload", fileUploadRoutes);


module.exports = app;