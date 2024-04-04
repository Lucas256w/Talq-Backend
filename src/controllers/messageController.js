const Message = require("../models/message");
const MessageRoom = require("../models/messageRoom");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const he = require("he");

const validate = (method) => {
  switch (method) {
    case "new_message": {
      return [body("message", "Message is required").trim().exists().escape()];
    }
  }
};

// new message handler --------------------------------------------------------------------------------

exports.new_message = validate("new_message").concat(
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const messageRoom = await MessageRoom.findById(req.params.roomId).exec();
    if (!messageRoom) {
      return res.status(400).json({ message: "Message room not found" });
    }

    if (!messageRoom.users.includes(req.user.userId)) {
      return res.status(400).json({ message: "User not in message room" });
    }

    const message = new Message({
      message: req.body.message,
      user: req.user.userId,
      messageRoom: req.params.roomId,
    });

    const processedMessage = message.toObject();
    processedMessage.user = {};
    processedMessage.user._id = req.user.userId;
    const timeDifference = Date.now() - processedMessage.created_at;
    if (timeDifference < 60000) {
      processedMessage.created_at = "Just now";
    } else if (timeDifference < 3600000) {
      processedMessage.created_at = `${Math.floor(timeDifference / 60000)} min`;
    } else if (timeDifference < 86400000) {
      processedMessage.created_at = `${Math.floor(
        timeDifference / 3600000
      )} hr`;
    } else {
      processedMessage.created_at = `${Math.floor(
        timeDifference / 86400000
      )} days`;
    }

    try {
      await message.save();
      res.json(processedMessage);
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  })
);

// get messages handler --------------------------------------------------------------------------------

exports.get_messages = asyncHandler(async (req, res) => {
  const messageRoom = await MessageRoom.findById(req.params.roomId).exec();
  if (!messageRoom) {
    return res.status(400).json({ message: "Message room not found" });
  }

  if (!messageRoom.users.includes(req.user.userId)) {
    return res.status(400).json({ message: "User not in message room" });
  }

  const messages = await Message.find({ messageRoom: req.params.roomId })
    .populate("user", "username profile_img")
    .exec();

  const processedMessages = [];

  //convert message time to a more readable format and unescape the message
  for (let message of messages) {
    let messageObject = message.toObject();
    const timeDifference = Date.now() - messageObject.created_at;
    if (timeDifference < 60000) {
      messageObject.created_at = "Just now";
    } else if (timeDifference < 3600000) {
      messageObject.created_at = `${Math.floor(timeDifference / 60000)} min`;
    } else if (timeDifference < 86400000) {
      messageObject.created_at = `${Math.floor(timeDifference / 3600000)} hr`;
    } else {
      messageObject.created_at = `${Math.floor(
        timeDifference / 86400000
      )} days`;
    }

    // unescape the message with he
    messageObject.message = he.decode(messageObject.message);

    processedMessages.push(messageObject);
  }

  res.json(processedMessages);
});
