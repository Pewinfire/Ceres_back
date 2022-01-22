const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: { type: String, required: true },
  /* image: { type: String, required: true }, */
  products: [{ type: mongoose.Types.ObjectId, ref: "Product" }]
});

module.exports = mongoose.model("Category", categorySchema);
