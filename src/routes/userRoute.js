const express = require("express");
const router = express.Router();
const upload = require("../../config/multerConfig");
const userController = require("../controllers/userController");
const verifyToken = require("../auth/token");

// POST request for user login
router.post("/login", userController.find_user);

// GET request to attempt to automatically re-login using JWT
router.get("/re-login", verifyToken, userController.re_login_user);

// POST request for user signup
router.post("/signup", upload.single("profile_img"), userController.new_user);

module.exports = router;
