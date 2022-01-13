const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const marketSchema = new Schema({
  name: { type: String, required: true },
  postalCode: { type: Number, required: true, length: 5 },
  image: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  shop: [{ type: mongoose.Types.ObjectId, ref: "Shop" }], // 1:N r
});

module.exports = mongoose.model("Market", marketSchema);
