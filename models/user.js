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
  address: { type: String, required: true },
  //userType: { type: mongoose.Types.ObjectId, required: true, ref: "UserType" },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
  bills: [{ type: mongoose.Types.ObjectId, ref: "Bill" }],
  shops: [{ type: mongoose.Types.ObjectId, ref: "Shop" }],
});

userSchema.plugin(uniqueValidator); // validar email (ya existe/no existe)

module.exports = mongoose.model("User", userSchema);
