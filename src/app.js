const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/user.routes");
const uploadRoutes = require("./routes/uploadRoutes");
const eventRoutes = require('./routes/event.routes');
const categoryRoutes = require('./routes/category.routes');
const preferencesRoutes = require('./routes/preference.routes');
const authRoutes = require("./routes/authRoutes");


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


module.exports = app;