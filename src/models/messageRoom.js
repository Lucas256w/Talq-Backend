const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const MessageRoomSchema = new Schema({
  users: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
});

module.exports = mongoose.model("MessageRoom", MessageRoomSchema);
