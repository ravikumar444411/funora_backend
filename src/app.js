const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/user.routes");
const uploadRoutes = require("./routes/uploadRoutes");


require("dotenv").config();

const app = express();
app.use(express.json()); // Middleware to parse JSON

// Connect to MongoDB
connectDB();

// Routes
app.use("/api", uploadRoutes);
app.use("/api", userRoutes);

module.exports = app;