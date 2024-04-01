const MessageRoom = require("../models/messageRoom");
const User = require("../models/user");
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

const validate = (method) => {
  switch (method) {
    case "new_message_room": {
      return [body("users", "Users must be an array of user ids").isArray()];
    }
  }
};

// new message room handler
exports.new_message_room = validate("new_message_room").concat(
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const users = await User.find({ _id: { $in: req.body.users } }).exec();
    if (users.length !== req.body.users.length) {
      return res.status(400).json({ message: "Users not found" });
    }

    const messageRoom = new MessageRoom({ users: req.body.users });

    try {
      await messageRoom.save();
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  })
);
