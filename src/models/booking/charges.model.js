const mongoose = require("mongoose");

const chargesSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },           // e.g., "GST", "Convenience Fee"
        type: { type: String, enum: ["percentage", "fixed"], default: "fixed" },
        value: { type: Number, required: true },          // if percentage: 18 means 18%
        description: { type: String },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Charges", chargesSchema);
