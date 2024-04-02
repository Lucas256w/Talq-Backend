const User = require("../models/user");
const FriendRequest = require("../models/friendRequest");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Validation function for different methods ------------------------------------------------------------

// Handler for getting all friends of a user ------------------------------------------------------------
exports.get_friends = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("friends", "_id profile_img username")
    .exec();
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  res.json(user.friends);
});

// Handler for removing a friend from a user's friend list ------------------------------------------------------------
exports.remove_friend = asyncHandler(async (req, res) => {
  const friend = await User.findById(req.params.id).exec();
  if (!friend) {
    return res.status(400).json({ message: "Friend not found" });
  }

  const user = await User.findById(req.user._id).exec();
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  //delete from both users' friend list
  await friend.friends.pull(user._id);
  await user.friends.pull(friend._id);

  await friend.save();
  await user.save();

  res.json({ message: "Friend removed" });
});
