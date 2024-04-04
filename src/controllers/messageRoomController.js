const MessageRoom = require("../models/messageRoom");
const User = require("../models/user");
const Message = require("../models/message");
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const he = require("he");

const validate = (method) => {
  switch (method) {
    case "new_message_room": {
      return [body("users", "Users must be an array of usernames").isArray()];
    }
    case "update_name": {
      return [body("name", "Name is required").trim().exists()];
    }
  }
};

// new message room handler --------------------------------------------------------------------------------
exports.new_message_room = validate("new_message_room").concat(
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // get users (only the ids are needed for the message room)
    const users = await User.find({ username: { $in: req.body.users } }).exec();

    if (users.length !== req.body.users.length) {
      return res.status(400).json({ message: "Users not found" });
    }

    // get the user who is creating the room
    const user = await User.findById(req.user.userId).exec();

    // add the user who is creating the room to the users array
    users.push(user);

    if (users.length === 2) {
      // if there are only two users (private), check if the message room already exists with the same users
      const existingRoom = await MessageRoom.findOne({
        users: { $size: users.length, $all: users.map((user) => user._id) },
      }).exec();
      if (existingRoom) {
        return res.status(400).json({ message: "Message room already exists" });
      }
    }

    const messageRoom = new MessageRoom({
      users: users.map((user) => user._id),
      type: users.length === 2 ? "private" : "group",
    });

    try {
      await messageRoom.save();
      res.json({ message: "Message room created" });
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  })
);

// get message room basic info for chat tab (usernames, last message, last message time) handler ------------
exports.get_message_rooms = asyncHandler(async (req, res) => {
  const messageRooms = await MessageRoom.find({
    users: { $in: [req.user.userId] },
  })
    .populate("users", "username profile_img")
    .exec();

  const processedMessageRooms = [];

  // for each message room, get only the last message and time
  for (let messageRoom of messageRooms) {
    let messageRoomObject = messageRoom.toObject();
    const lastMessage = await Message.findOne({
      messageRoom: messageRoom._id,
    })
      .sort({ created_at: -1 })
      .limit(1)
      .exec();

    if (!lastMessage) {
      //if there are no messages in the room, set the last message to an empty string and the last message time to 0
      messageRoomObject.lastMessage = "";
      messageRoomObject.lastMessageTime = 0;
      processedMessageRooms.push(messageRoomObject);
      continue;
    }

    messageRoomObject.lastMessage = lastMessage.message;
    messageRoomObject.lastMessageTime = lastMessage.created_at.getTime();

    // convert the last message time to a more readable format (e.g. "2 hours ago")
    const timeDifference = Date.now() - lastMessage.created_at;
    if (timeDifference < 60000) {
      messageRoomObject.lastUpdated = "Just now";
    } else if (timeDifference < 3600000) {
      messageRoomObject.lastUpdated = `${Math.floor(
        timeDifference / 60000
      )} min`;
    } else if (timeDifference < 86400000) {
      messageRoomObject.lastUpdated = `${Math.floor(
        timeDifference / 3600000
      )} hr`;
    } else {
      messageRoomObject.lastUpdated = `${Math.floor(
        timeDifference / 86400000
      )} days`;
    }

    // unescape the message
    messageRoomObject.lastMessage = he.decode(messageRoomObject.lastMessage);
    processedMessageRooms.push(messageRoomObject);
  }

  //exclude the user who is requesting the message rooms
  for (let messageRoom of processedMessageRooms) {
    messageRoom.users = messageRoom.users.filter(
      (user) => user._id.toString() !== req.user.userId
    );
  }

  //sort the rooms by the last message time
  processedMessageRooms.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

  res.json(processedMessageRooms);
});

// get message room handler --------------------------------------------------------------------------------
exports.get_message_room = asyncHandler(async (req, res) => {
  const messageRoom = await MessageRoom.findById(req.params.id)
    .populate("users", "username profile_img")
    .exec();
  if (!messageRoom) {
    return res.status(400).json({ message: "Message room not found" });
  }

  if (
    !messageRoom.users
      .map((user) => user._id.toString())
      .includes(req.user.userId.toString())
  ) {
    return res.status(400).json({ message: "User not in message room" });
  }

  res.json(messageRoom);
});

// add additional user(s) to message room handler ------------------------------------------------------------
exports.add_user = asyncHandler(async (req, res) => {
  const messageRoom = await MessageRoom.findById(req.params.id).exec();
  if (!messageRoom) {
    return res.status(400).json({ message: "Message room not found" });
  }

  const users = await User.find({ username: { $in: req.body.users } }).exec();
  if (users.length !== req.body.users.length) {
    return res.status(400).json({ message: "Users not found" });
  }

  // if there are users who are already in the message room that is the same as the ones to be added, respond with an error
  for (let user of users) {
    if (messageRoom.users.includes(user._id)) {
      return res.status(400).json({ message: "User already in message room" });
    }
  }

  messageRoom.users = messageRoom.users.concat(users.map((user) => user._id));

  await messageRoom.save();
  res.json({ message: "Users added to message room" });
});

// remove user from message room handler ------------------------------------------------------------------
exports.remove_user = asyncHandler(async (req, res) => {
  const messageRoom = await MessageRoom.findById(req.params.id).exec();
  if (!messageRoom) {
    return res.status(400).json({ message: "Message room not found" });
  }

  const user = await User.findById(req.user.userId).exec();
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  messageRoom.users = messageRoom.users.filter(
    (userId) => userId.toString() !== user._id.toString()
  );

  // if there is only one user left in the message room, delete the room
  if (messageRoom.users.length === 1) {
    const messages = await Message.find({
      messageRoom: messageRoom._id,
    }).exec();
    // if there are no messages in the room, just delete the room
    if (messages.length === 0) {
      await messageRoom.deleteOne();
      return res.json({ message: "Message room deleted" });
    }

    for (let message of messages) {
      await message.deleteOne();
    }
    await messageRoom.deleteOne();
    return res.json({ message: "Message room deleted" });
  }

  await messageRoom.save();
  res.json({ message: "User removed from message room" });
});

// update message room name handler ------------------------------------------------------------------
exports.update_name = validate("update_name").concat(
  asyncHandler(async (req, res) => {
    const messageRoom = await MessageRoom.findById(req.params.id).exec();
    if (!messageRoom) {
      return res.status(400).json({ message: "Message room not found" });
    }

    if (
      !messageRoom.users
        .map((user) => user.toString())
        .includes(req.user.userId.toString())
    ) {
      return res.status(400).json({ message: "User not in message room" });
    }

    messageRoom.name = req.body.name;

    await messageRoom.save();
    res.json({ message: "Message room name updated" });
  })
);
