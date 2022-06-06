const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const pedidosSchema = new Schema({
  facturas: [{ type: mongoose.Types.ObjectId, ref: "Order" }],
  user: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

module.exports = mongoose.model("Pedidos", pedidosSchema);
