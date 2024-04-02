const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const verifyToken = require("../auth/token");

// GET request for getting all friends of a user
router.get("/friends", verifyToken, userController.get_friends);

// DELETE request for removing a friend from a user's friend list
router.delete("/friends/:id", verifyToken, userController.remove_friend);

module.exports = router;
