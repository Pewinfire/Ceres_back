const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const rolSchema = new Schema({
  rol: { type: String, required: true },
  isAdmin: { type: Boolean, required: true },
  isSeller: { type: Boolean, required: true },
  users: [{ type: mongoose.Types.ObjectId, ref: "User" }],
});



module.exports = mongoose.model("Rol", rolSchema);
