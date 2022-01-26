const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  content: { type: String, required: true },
  stars: {type: Number, required: true},
  user: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  shop: { type: mongoose.Types.ObjectId, required: true, ref: "Shop" },
});

module.exports = mongoose.model("Review", reviewSchema);
