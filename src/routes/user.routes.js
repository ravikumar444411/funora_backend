const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

router.post("/users", userController.createUser);
router.get("/users", userController.getAllUsers);
router.post("/users/single_user", userController.getUserById);
router.put("/users/update_user", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);

module.exports = router;
