const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true }, //index, fast query
  password: { type: String, required: true, minlength: 6 },
  dni: { type: String, required: true },
  phone: { type: String, required: true, maxlength: 9 },
  image: { type: String, required: true },
  address: {
    address: { type: String, required: true },
    province: { type: String, required: true },
    locality: { type: String, required: true },
    postalCode: { type: String, required: true },
  }, 
  cart: {
    cartItem: [
      {
        product: {
          type: mongoose.Types.ObjectId,
          required: true,
          ref: "Product",
        },
        shop:{
          type: mongoose.Types.ObjectId,
          required: true,
          ref: "Shop",
        },
        quantity: { type: Number, required: true },
       
      },
    ],
  },
  reviews: [{ type: mongoose.Types.ObjectId, ref: "Review" }],
  orders: [{ type: mongoose.Types.ObjectId, ref: "Order" }],
  shop: { type: mongoose.Types.ObjectId, ref: "Shop" },
  rol: { type: mongoose.Types.ObjectId, required: true, ref: "Rol" },
});

userSchema.plugin(uniqueValidator); // validar email (ya existe/no existe)

module.exports = mongoose.model("User", userSchema);
