const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String },
  shop: { type: mongoose.Types.ObjectId, required: true, ref: "Shop" },
  carts: [{ type: mongoose.Types.ObjectId, ref: "Cart" }],
  sales:  [{ type: mongoose.Types.ObjectId, ref: "Sale" }], // 1:N relacion
  categories: [{ type: mongoose.Types.ObjectId, ref: "Category" }]
});

module.exports = mongoose.model("Product", productSchema);
