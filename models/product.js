const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  stats: {
    price: { type: Number },
    stock: { type: Number },
    discount: { type: Number },
    size: [
      {
        value: { type: Number },
      },
    ],
    format: { type: String },
  },
  carts: [{ type: mongoose.Types.ObjectId, ref: "Cart" }],
  categories: [{ type: mongoose.Types.ObjectId, ref: "Category" }],
  shop: { type: mongoose.Types.ObjectId, required: true, ref: "Shop" },
});

module.exports = mongoose.model("Product", productSchema);
