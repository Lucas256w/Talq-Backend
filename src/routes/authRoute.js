const express = require("express");
const router = express.Router();
const upload = require("../../config/multerConfig");
const authController = require("../controllers/authController");
const verifyToken = require("../auth/token");

// POST request for user login
router.post("/login", authController.find_user);

// GET request to attempt to automatically re-login using JWT
router.get("/re-login", verifyToken, authController.re_login_user);

// POST request for user signup
router.post("/signup", upload.single("profile_img"), authController.new_user);

module.exports = router;
