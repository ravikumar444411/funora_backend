const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

router.post("/users", userController.createUser);
router.get("/users", userController.getAllUsers);
router.get("/users/:id", userController.getUserById);
router.put("/users/:id", userController.updateUser);

module.exports = router;
