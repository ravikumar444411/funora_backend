const Category = require("../models/category.model");
const { sendResponse, formatCategoryResponse } = require("../utils/responseFormatter");
const uploadToS3 = require("../utils/s3Upload");

// Create Category
exports.createCategory = async (req, res) => {
    try {
        const { categoryName } = req.body;

        if (!categoryName) {
            return sendResponse(res, false, [], "Category name is required", 400);
        }

        let categoryImage = "";
        if (req.file) {
            categoryImage = await uploadToS3(req.file);
        }

        const newCategory = new Category({
            categoryName,
            categoryImage,
            isActive: true,
        });

        await newCategory.save();
        return sendResponse(res, true, newCategory, "Category created successfully", 201);
    } catch (error) {
        console.error("Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

// Get All Active Categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        const formattedCategories = categories.map(formatCategoryResponse);
        return sendResponse(res, true, formattedCategories, "Categories fetched successfully", 200);
    } catch (error) {
        console.error("Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

// Get Single Category by ID
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findOne({ _id: req.params.id, isActive: true });

        if (!category) return sendResponse(res, false, [], "Category not found", 404);

        const formattedCategory = formatCategoryResponse(category);
        return sendResponse(res, true, formattedCategory, "Category fetched successfully", 200);
    } catch (error) {
        console.error("Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

// Update Category (Only update provided fields)
exports.updateCategory = async (req, res) => {
    try {
        const { id: categoryId } = req.params;
        const updateFields = {};

        if (req.body.categoryName !== undefined) {
            updateFields.categoryName = req.body.categoryName;
        }

        if (req.file) {
            updateFields.categoryImage = await uploadToS3(req.file);
        }

        const updatedCategory = await Category.findByIdAndUpdate(categoryId, updateFields, { new: true });

        if (!updatedCategory) {
            return sendResponse(res, false, [], "Category not found", 404);
        }

        return sendResponse(res, true, updatedCategory, "Category updated successfully", 200);
    } catch (error) {
        console.error("Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};

// Soft Delete Category (Mark as Inactive)
exports.deleteCategory = async (req, res) => {
    try {
        const { id: categoryId } = req.params;

        const deletedCategory = await Category.findByIdAndUpdate(
            categoryId,
            { isActive: false },
            { new: true }
        );

        if (!deletedCategory) {
            return sendResponse(res, false, [], "Category not found", 404);
        }

        return sendResponse(res, true, deletedCategory, "Category deleted successfully", 200);
    } catch (error) {
        console.error("Error:", error);
        return sendResponse(res, false, [], "Internal Server Error", 500);
    }
};
