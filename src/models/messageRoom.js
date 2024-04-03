const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const MessageRoomSchema = new Schema({
  users: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
  name: { type: String },
  type: { type: String, required: true, enum: ["private", "group"] },
});

module.exports = mongoose.model("MessageRoom", MessageRoomSchema);
