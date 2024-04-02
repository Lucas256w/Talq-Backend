const FriendRequest = require("../models/friendRequest");
const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Validation function for different methods ------------------------------------------------------------
const validate = (method) => {
  switch (method) {
    case "new_friend_request": {
      return [body("username", "username is required").escape().notEmpty()];
    }
  }
};

// Handler for creating a new friend request ------------------------------------------------------------
exports.new_friend_request = validate("new_friend_request").concat(
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find the user to whom the friend request is being sent
    const to = await User.findOne({ username: req.body.username }).exec();
    if (!to) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if the user is trying to send a friend request to themselves
    if (to._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot send request to self" });
    }

    // Check if the users are already friends
    const existingFriend = await User.findOne({
      _id: req.user._id,
      friends: to._id,
    }).exec();
    if (existingFriend) {
      return res.status(400).json({ message: "Already friends" });
    }

    // Check if the friend request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { from: req.user._id, to: to._id },
        { from: to._id, to: req.user._id },
      ],
    }).exec();

    if (existingRequest) {
      let message = "Request already exists";
      // If the found request is one where the current receiver is the sender, adjust the message accordingly
      if (
        existingRequest.from.toString() === to._id.toString() &&
        existingRequest.to.toString() === req.user._id.toString()
      ) {
        message = "Receiving user already sent a friend request";
      }
      return res.status(400).json({ message });
    }

    // Create and save the new friend request
    const friendRequest = new FriendRequest({
      from: req.user._id,
      to: to._id,
    });
    try {
      await friendRequest.save();
      return res.json({ message: "Friend request sent" });
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  })
);

// Handler for getting all incoming friend requests for a user ------------------------------------------
exports.get_received_requests = asyncHandler(async (req, res) => {
  const friendRequests = await FriendRequest.find({ to: req.user._id })
    .populate("from", "username profile_img")
    .exec();
  res.json(friendRequests);
});

// Handler for getting all outgoing friend requests for a user ------------------------------------------
exports.get_sent_requests = asyncHandler(async (req, res) => {
  const friendRequests = await FriendRequest.find({
    from: req.user._id,
  })
    .populate("to", "username profile_img")
    .exec();
  res.json(friendRequests);
});

// Handler for accepting a friend request ----------------------------------------------------------------
exports.accept_friend_request = asyncHandler(async (req, res) => {
  const friendRequest = await FriendRequest.findById(req.params.id).exec();
  if (!friendRequest) {
    return res.status(400).json({ message: "Request not found" });
  }

  // Check if the user is the receiver of the request
  if (friendRequest.to.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  // Add the users to each other's friends list
  await User.findByIdAndUpdate(friendRequest.from, {
    $push: { friends: friendRequest.to },
  }).exec();
  await User.findByIdAndUpdate(friendRequest.to, {
    $push: { friends: friendRequest.from },
  }).exec();

  // Delete the friend request
  await FriendRequest.findByIdAndDelete(req.params.id).exec();
  res.json({ message: "Friend request accepted" });
});

// Handler for deleting a friend request (reject or canel a request) ----------------------------------------------------------------
exports.delete_friend_request = asyncHandler(async (req, res) => {
  const friendRequest = await FriendRequest.findById(req.params.id).exec();
  if (!friendRequest) {
    return res.status(400).json({ message: "Request not found" });
  }

  // Delete the friend request
  await FriendRequest.findByIdAndDelete(req.params.id).exec();
  res.json({ message: "Friend request rejected" });
});
