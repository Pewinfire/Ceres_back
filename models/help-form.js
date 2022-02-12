const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const helpSchema = new Schema({
  user: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  solved: { type: Boolean },
  response: { type: String },
});

module.exports = mongoose.model("Help", helpSchema);
