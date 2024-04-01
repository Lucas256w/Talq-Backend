const express = require("express");
const router = express.Router();
const messageRoomController = require("../controllers/messageRoomController");
const verifyToken = require("../auth/token");

// POST request for creating a new message room
router.post(
  "/message-room",
  verifyToken,
  messageRoomController.new_message_room
);

module.exports = router;
