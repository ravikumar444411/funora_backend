// const MasterLocation = require("../models/location/masterLocation.model");
const path = require("path");
const fs = require("fs");
const { sendResponse } = require("../utils/responseFormatter");
const Location = require("../models/location.model");

// Fetch all locations from JSON file
exports.getAllLocationsFromFile = async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../data/location.json");
    const fileData = fs.readFileSync(filePath, "utf-8");

    const locations = JSON.parse(fileData);

    return res.status(200).json({
      success: true,
      message: "Locations fetched successfully",
      data: locations,
    });
  } catch (err) {
    console.error("Error reading location.json:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// Create or update user location
exports.updateUserLocation = async (req, res) => {
  try {
    const { userId, type, manualAddress, coordinates } = req.body;

    if (!userId || !type) {
      return sendResponse(res, false, [], "userId and type are required", 400);
    }

    let updateData = { type };

    if (type === "manual") {
      if (!manualAddress || !coordinates?.lat || !coordinates?.lng) {
        return sendResponse(res, false, [], "Manual address and coordinates are required", 400);
      }

      updateData.manualLocation = {
        name: manualAddress,
        coordinates: {
          lat: coordinates.lat,
          lng: coordinates.lng,
        },
      };
      updateData.gpsLocation = {}; // reset if switching
    }

    if (type === "gps") {
      if (!coordinates?.lat || !coordinates?.lng) {
        return sendResponse(res, false, [], "GPS coordinates are required for gps type", 400);
      }

      updateData.gpsLocation = {
        lat: coordinates.lat,
        lng: coordinates.lng,
      };
      updateData.manualLocation = {}; // reset if switching
    }

    // Upsert user location
    const updatedLocation = await Location.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return sendResponse(res, true, updatedLocation, "User location updated successfully", 200);
  } catch (err) {
    console.error("Error updating user location:", err);
    return sendResponse(res, false, [], "Internal Server Error", 500);
  }
};

