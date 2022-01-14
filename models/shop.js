const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const shopSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  image: { type: String },
  owner: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  marketo: { type: mongoose.Types.ObjectId, required: true, ref: "Market" }, // 1:N relacion
});

module.exports = mongoose.model("Shop", shopSchema);
