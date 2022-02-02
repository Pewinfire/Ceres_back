const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const shopSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true},
  description: { type: String, required: true },
  location: { type: String, required: true },
  image: { type: String, required: true},
  active: { type: Boolean },
  owner: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  marketo: { type: mongoose.Types.ObjectId, required: true, ref: "Market" },
  products: [{ type: mongoose.Types.ObjectId, ref: "Product" }],
  reviews: [{ type: mongoose.Types.ObjectId, ref: "Reviews" }],
});

module.exports = mongoose.model("Shop", shopSchema);
