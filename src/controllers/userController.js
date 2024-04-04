const User = require("../models/user");
const FriendRequest = require("../models/friendRequest");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const he = require("he");

const cloudinary = require("../../config/cloudinaryConfig");

// Validation function for different methods ------------------------------------------------------------
const validate = (method) => {
  switch (method) {
    case "update_username": {
      return [
        body("username", "Username is required").exists(),
        body(
          "username",
          "Username must be at least 3 characters long"
        ).isLength({
          min: 3,
        }),
      ];
    }
    case "update_email": {
      return [
        body("email", "Must be a valid email address")
          .isEmail()
          .normalizeEmail(),
      ];
    }
    case "update_password": {
      return [
        body("currentPassword", "Password is required").exists(),
        body("newPassword", "New password is required").exists(),
        body(
          "newPassword",
          "New password must be at least 8 characters long"
        ).isLength({
          min: 8,
        }),
        body("confirmPassword", "Passwords do not match").custom(
          (value, { req }) => value === req.body.newPassword
        ),
      ];
    }
  }
};

// Handler for getting all friends of a user ------------------------------------------------------------
exports.get_friends = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId)
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

  const user = await User.findById(req.user.userId).exec();
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

// Handler for getting user's account details ------------------------------------------------------------
exports.get_account_details = asyncHandler(async (req, res) => {
  //exclude password and friends list
  const user = await User.findById(req.user.userId)
    .select("-password -friends")
    .exec();

  res.json(user);
});

// Handler for upadting user's profile image ------------------------------------------------------------
exports.update_profile_img = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const user = await User.findById(req.user.userId).exec();
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  //delete previous image from cloudinary
  if (user.cloudinary_id) {
    await cloudinary.uploader.destroy(user.cloudinary_id);
  }

  //upload new image to cloudinary
  const result = await cloudinary.uploader.upload(req.file.path);

  //update user's profile image and cloudinary id
  user.profile_img = result.secure_url;
  user.cloudinary_id = result.public_id;

  await user.save();

  res.json({ message: "Profile image updated" });
});

// Handler for updating user's username ------------------------------------------------------------
exports.update_username = validate("update_username").concat(
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.userId).exec();
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    //check if new username is already taken
    const existingUser = await User.findOne({
      username: req.body.username,
    }).exec();
    if (existingUser) {
      return res.status(409).json({ message: "Username taken" });
    }

    //check if password is correct
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Incorrect password" });
    } else {
      user.username = req.body.username;
      await user.save();
      res.json({ message: "Username updated" });
    }
  })
);

// Handler for updating user's email ------------------------------------------------------------
exports.update_email = validate("update_email").concat(
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.userId).exec();
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    //check if new email is already taken
    const existingEmail = await User.findOne({
      email: req.body.email,
    }).exec();

    if (existingEmail) {
      return res.status(409).json({ message: "Email taken" });
    }

    //check if password is correct
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Incorrect password" });
    } else {
      user.email = req.body.email;
      await user.save();
      res.json({ message: "Email updated" });
    }
  })
);

// Handler for updating user's password ------------------------------------------------------------
exports.update_password = validate("update_password").concat(
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.userId).exec();
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    //check if old password is correct
    const match = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: "Incorrect password" });
    } else {
      const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
      user.password = hashedPassword;
      await user.save();
      res.json({ message: "Password updated" });
    }
  })
);
