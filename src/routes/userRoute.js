const express = require("express");
const router = express.Router();
const upload = require("../../config/multerConfig");
const userController = require("../controllers/userController");
const verifyToken = require("../auth/token");

// GET request for getting all friends of a user
router.get("/friends", verifyToken, userController.get_friends);

// DELETE request for removing a friend from a user's friend list
router.delete("/friends/:id", verifyToken, userController.remove_friend);

// GET request for getting user's account details
router.get("/user", verifyToken, userController.get_account_details);

// PUT request for updating user's profile image
router.put(
  "/user/profile-img",
  verifyToken,
  upload.single("profile_img"),
  userController.update_profile_img
);

// PUT request for updating user's username
router.put("/user/username", verifyToken, userController.update_username);

// PUT request for updating user's email
router.put("/user/email", verifyToken, userController.update_email);

// PUT request for updating user's password
router.put("/user/password", verifyToken, userController.update_password);

module.exports = router;
