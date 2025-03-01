const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/user.routes");

require("dotenv").config();

const app = express();
app.use(express.json()); // Middleware to parse JSON

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/users", userRoutes);

module.exports = app;
