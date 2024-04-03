const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const verifyToken = require("../auth/token");

// POST request for sending a message
router.post("/messages/:roomId", verifyToken, messageController.new_message);

// GET request for getting all messages in a message room
router.get("/messages/:roomId", verifyToken, messageController.get_messages);

module.exports = router;
