const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const upload = require("../config/multer"); // Multer middleware for file uploads

router.post("/create", upload.single("images"), categoryController.createCategory);
router.get("/", categoryController.getCategories);
router.get("/:id", categoryController.getCategoryById);
router.put("/:id", upload.single("images"), categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

module.exports = router;
