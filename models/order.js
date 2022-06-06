const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  client: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  vendor: { type: mongoose.Types.ObjectId, required: true, ref: "Shop" },
  soldProducts: [
    {
      product: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Product",
      },
      shop: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Shop",
      },
      quantity: { type: Number, required: true },
    },
  ],
  dateOrder: { type: Date, default: Date.now},
  billingAddress: {
    address: { type: String, required: true },
    province: { type: String, required: true },
    locality: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  pedido:{ type: mongoose.Types.ObjectId, required: true, ref: "Pedidos" },
  aceptado: { type: Boolean, default: false },
  cancelado: {type: Boolean, default: false},
  puntuación: {type: Number }
});

module.exports = mongoose.model("Order", orderSchema);
