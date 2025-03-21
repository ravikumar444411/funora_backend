const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
    {
        categoryName: { type: String, required: true },
        categoryImage: { type: String, default: "" },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Category", CategorySchema);
