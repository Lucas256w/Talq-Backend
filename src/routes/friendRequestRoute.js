const express = require("express");
const router = express.Router();
const friendRequestController = require("../controllers/friendRequestController");
const verifyToken = require("../auth/token");

// POST request for sending a friend request
router.post(
  "/friend-requests",
  verifyToken,
  friendRequestController.new_friend_request
);

// GET request for getting all incoming friend requests for a user
router.get(
  "/friend-requests/received",
  verifyToken,
  friendRequestController.get_received_requests
);

// GET request for getting all outgoing friend requests for a user
router.get(
  "/friend-requests/sent",
  verifyToken,
  friendRequestController.get_sent_requests
);

// POST request for accepting a friend request
router.post(
  "/friend-requests/accept/:id",
  verifyToken,
  friendRequestController.accept_friend_request
);

// DELETE request for deleting a friend request (reject or cancel a request)
router.delete(
  "/friend-requests/:id",
  verifyToken,
  friendRequestController.delete_friend_request
);

module.exports = router;
