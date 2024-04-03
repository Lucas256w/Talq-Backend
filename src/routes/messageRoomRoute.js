const express = require("express");
const router = express.Router();
const messageRoomController = require("../controllers/messageRoomController");
const verifyToken = require("../auth/token");

// POST request for creating a new message room
router.post(
  "/message-rooms",
  verifyToken,
  messageRoomController.new_message_room
);

// GET request for getting all message rooms of a user
router.get(
  "/message-rooms",
  verifyToken,
  messageRoomController.get_message_rooms
);

// GET request for getting one message room
router.get(
  "/message-room/:id",
  verifyToken,
  messageRoomController.get_message_room
);

// PUT request for adding a user to a message room
router.put(
  "/message-room/add-user/:id",
  verifyToken,
  messageRoomController.add_user
);

// DELETE request for removing a user from a message room
router.delete(
  "/message-room/remove-user/:id",
  verifyToken,
  messageRoomController.remove_user
);

// PUT request to update the name of a message room
router.put(
  "/message-room/update-name/:id",
  verifyToken,
  messageRoomController.update_name
);

module.exports = router;
