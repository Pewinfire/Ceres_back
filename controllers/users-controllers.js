const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const HttpError = require("../models/http-error");
const User = require("../models/user");
const Rol = require("../models/rol");
const Reviews = require("../models/reviews");
const Shop = require("../models/shop");
const Help = require("../models/help-form");
const mongoose = require("mongoose");
const Product = require("../models/product");
const checkRol = require("../util/checkRol");
const user = require("../models/user");
const getPagination = require("../util/pagination");

//SIGN UP

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(" Invalid inputs passed, please check your data", 422)
    );
  }
  const { name, lastname, email, password, phone, dni, address } = req.body;

  let existingUser;
  let UserRol = await Rol.findById("61f139ed9f9766acbd29b445");
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead",
      422
    );
    return next(error);
  }
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12); // 12 salting rounds
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again ",
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    lastname,
    email,
    password: hashedPassword,
    phone,
    dni,
    image: req.file.path,
    address,
    rol: UserRol,
  });
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await await createdUser.save({ session: sess });
    UserRol.users.push(createdUser);
    await UserRol.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }
  let token;
  try {
    token = jwt.sign(
      {
        userId: createdUser.id,
        email: createdUser.email,
      },
      process.env.JWT_KEY,
      { expiresIn: "2h" }
    ); // args 1. payload , 2.key del sv  3. expiracion
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  res.status(201).json({
    userId: createdUser.id,
    email: createdUser.email,
    token: token,
  });
};

//LOGIN

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in",
      401
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password); // no recrea el encriptado, comprueba la posibilidad de haberlo creado el. Booleano
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError("Invalid password, could not log you in", 401);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_KEY,
      {
        expiresIn: "2h",
      }
    );
  } catch (err) {
    const error = new HttpError("Loggin failed, please try again later.", 500);
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

//UPDATE CONTROL USER(mismo) , ADMIN

const getUserById = async (req, res, next) => {
  const userId = req.params.uid;
  let user;
  try {
    user = await User.findById(
      { _id: userId },
      "-password -cart -orders -reviews "
    );
  } catch (err) {
    const error = new HttpError(
      "No se han podido obtener los datos del usuario",
      500
    );
    return next(error);
  }
  if (!user) {
    const error = new HttpError(
      "No se ha encontrado un usuario para el id proporcionado.",
      404
    );
    return next(error);
  }

  try {
    await checkRol(req.userData.userId, user.id);
  } catch (err) {
    const error = new HttpError("Unautorizhed", 401);
    return next(error);
  }

  res.json({ user: user.toObject({ getters: true }) });
};

//UPDATE CONTROL USER(mismo) , ADMIN

const updateUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(" Invalid inputs passed, please check your data", 422)
    );
  }
  const { name, lastname, phone, dni, address, imageup } = req.body;

  const userId = req.params.uid;

  let user;

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      "Algo ha ido mal, no se ha podido actualizar el usuario, intentelo de nuevo",
      500
    );
    return next(error);
  }

  try {
    await checkRol(req.userData.userId, user.id);
  } catch (err) {
    const error = new HttpError("Unautorizhed", 401);
    return next(error);
  }

  user.name = name;
  user.lastname = lastname;
  user.phone = phone;
  user.dni = dni;
  user.address = address;

  const imagePath = user.image;
  if (imageup === "true") {
    user.image = req.file.path;
  }
  try {
    await user.save();

    if (imageup === "true") {
      fs.unlink(imagePath, (err) => {});
    }
  } catch (err) {
    const error = new HttpError(
      "No se ha podido actualizar el Usuario, intentelo de nuevo",
      500
    );
    return next(error);
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};

//ADMIN   //desactivada de rutas, no se va a usar

const createRol = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(" Invalid inputs passed, please check your data", 422)
    );
  }
  const { rol, isAdmin, isSeller } = req.body;

  const createdRol = new Rol({
    rol,
    isAdmin,
    isSeller,
  });

  try {
    await createdRol.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(201).json({ rol: createdRol.toObject({ getters: true }) });
};

// PERMISOS EN DISEÑO/DESARROLLO
const getUsers = async (req, res, next) => {
  const { limit, offset } = getPagination(req.params.page, req.params.size);
  const ifSort = req.params.sort !== "name" ? req.params.sort : "name";
  const ifName = req.params.sch !== "user" ? req.params.sch : "";

  let users;
  let totalItems;
  let totalUsers;
  try {
    totalItems = await User.countDocuments({});
    totalUsers = await User.countDocuments({
      $or: [
        { name: { $regex: ifName, $options: "i" } },
        { lastname: { $regex: ifName, $options: "i" } },
        { email: { $regex: ifName, $options: "i" } },
        { dni: { $regex: ifName, $options: "i" } },
        { phone: { $regex: ifName, $options: "i" } },
        { address: { $regex: ifName, $options: "i" } },
        /*  {
          rol: { $regex: ifName, $options: "i" },
        }, */
      ],
    });
    users = await User.find(
      {
        $or: [
          { name: { $regex: ifName, $options: "i" } },
          { lastname: { $regex: ifName, $options: "i" } },
          { email: { $regex: ifName, $options: "i" } },
          { dni: { $regex: ifName, $options: "i" } },
          { phone: { $regex: ifName, $options: "i" } },
          { address: { $regex: ifName, $options: "i" } },
          /*  {
            rol: { $regex: ifName, $options: "i" },
          }, */
        ],
      },
      "-password"
    )
      .sort({ [ifSort]: req.params.dir })
      .populate("rol", "rol rol")
      .skip(offset)
      .limit(limit);
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }
  res.json({
    totalPages: Math.ceil(totalUsers / limit),
    totalItems: totalItems,
    limit: limit,
    currentPageSize: users.length,
    users: users.map((user) => user.toObject({ getters: true })),
  });
};

const getVendors = async (req, res, next) => {
  try {
    await checkRol(req.userData.userId, "1231231232");
  } catch (err) {
    const error = new HttpError("Unautorizhed", 401);
    return next(error);
  }
  let users;
  try {
    users = await User.find(
      { rol: "61f139f39f9766acbd29b447" },
      "-password -cart -bill -shops"
    );
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again.",
      500
    );
    return next(error);
  }

  res.json({
    users: users.map((user) => user.toObject({ getters: true })),
  });
};

const getAuth = async (req, res, next) => {
  let checkRol;
  let rol;
  try {
    checkRol = await User.findById(req.userData.userId);
    rol = await Rol.findById(checkRol.rol);
  } catch (err) {
    const error = new HttpError(err, 401);
    return next(error);
  }
  let Authorization;
  if (rol.isAdmin === true) {
    Authorization = "isAdmin";
  }
  if (rol.isSeller === true) {
    Authorization = "isSeller";
  }
  if (rol.isAdmin === false && rol.isSeller === false) {
    Authorization = "isClient";
  }

  res.json({ Authorization });
};

const setSeller = async (req, res, next) => {
  const userId = req.params.uid;
  let user;

  try {
    await checkRol(req.userData.userId, "1231231232");
  } catch (err) {
    const error = new HttpError("Unautorizhed", 401);
    return next(error);
  }
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      "Algo ha ido mal, no se ha podido actualizar el usuario, intentelo de nuevo",
      500
    );
    return next(error);
  }
  let newRol;
  let oldRol = user.rol;
  let ifSeller =
    user.rol.toString() === "61f139f39f9766acbd29b447"
      ? "61f139ed9f9766acbd29b445"
      : "61f139f39f9766acbd29b447";
  try {
    newRol = await Rol.findById(ifSeller);
    oldRol = await Rol.findById(oldRol);
  } catch (err) {
    const error = new HttpError(
      "Algo ha ido mal, no se ha podido actualizar el usuario, intentelo de nuevo",
      500
    );
    return next(error);
  }
  user.rol = newRol;
  console.log(newRol, oldRol);
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await await user.save({ session: sess });
    oldRol.users.pull(user);
    await oldRol.save({ session: sess });
    newRol.users.push(user);
    await newRol.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};

const updatePass = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(" Invalid inputs passed, please check your data", 422)
    );
  }
  const { password, oldPassword } = req.body;

  const userId = req.params.uid;

  let user;

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      "Algo ha ido mal, no se ha podido actualizar el usuario, intentelo de nuevo",
      500
    );
    return next(error);
  }

  try {
    await checkRol(req.userData.userId, user.id);
  } catch (err) {
    const error = new HttpError("Unautorizhed", 401);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(oldPassword, user.password); // no recrea el encriptado, comprueba la posibilidad de haberlo creado el. Booleano
  } catch (err) {
    const error = new HttpError(
      "No se ha podido comprobar la antigua contraseña, reintentelo",
      500
    );
    return next(error);
  }
  if (!isValidPassword) {
    const error = new HttpError(
      "La contraseña antigua no coincide con la registrada, intentelo de nuevo",
      401
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12); // 12 salting rounds
  } catch (err) {
    const error = new HttpError(
      "No se ha podido crear al usuario, intentelo de nuevo ",
      500
    );
    return next(error);
  }

  user.password = hashedPassword;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      "No se ha podido actualizar el Usuario, intentelo de nuevo",
      500
    );
    return next(error);
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};

const addToUserCart = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(" Invalid inputs passed, please check your data", 422)
    );
  }
  const { productId, productSize } = req.body;

  const userId = req.userData.userId;

  let user;

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      "Algo ha ido mal, no se ha podido añadir el producto a la cesta, intentelo de nuevo",
      500
    );
    return next(error);
  }

  try {
    await checkRol(req.userData.userId, user.id);
  } catch (err) {
    const error = new HttpError("Unautorizhed", 401);
    return next(error);
  }

  let product;

  try {
    product = await Product.findById(productId);
  } catch (err) {
    const error = new HttpError(
      "Algo ha ido mal, no se ha podido encontrar el producto, pruebe de nuevo",
      500
    );
    return next(error);
  }
  let quantity = productSize;
  let cart = user.cart.cartItem;
  let productIndex = user.cart.cartItem.findIndex((cp) => {
    return cp.product.toString() === product._id.toString();
  });
  if (product.stats.stock > quantity) {
    if (productIndex >= 0) {
      cart[productIndex].quantity =
        user.cart.cartItem[productIndex].quantity + quantity;
    } else {
      cart.push({
        product: product,
        quantity,
      });
    }
    console.log(user.cart.cartItem);
    console.log(cart);
    user.cart.cartItem = cart;
    console.log(user.cart.cartItem);
  } else {
    const error = new HttpError("Este producto se encuentra sin stock", 428);
    return next(error);
  }

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};

const contactForm = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(" Invalid inputs passed, please check your data", 422)
    );
  }
  const { subject, description } = req.body;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "No se han podido obtener los datos del usuario",
      500
    );
    return next(error);
  }
  if (!user) {
    const error = new HttpError(
      "No se ha encontrado un usuario para el id proporcionado.",
      404
    );
    return next(error);
  }

  try {
    await checkRol(req.userData.userId, user.id);
  } catch (err) {
    const error = new HttpError("Unautorizhed", 401);
    return next(error);
  }
  const createdForm = new Help({
    subject,
    description,
    user: req.userData.userId,
  });

  try {
    await createdForm.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(201).json({ form: createdForm.toObject({ getters: true }) });
};

const getHelpFormsByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let forms;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "No se han podido obtener los datos del usuario",
      500
    );
    return next(error);
  }
  if (!user) {
    const error = new HttpError(
      "No se ha encontrado un usuario para el id proporcionado.",
      404
    );
    return next(error);
  }

  try {
    await checkRol(req.userData.userId, user.id);
  } catch (err) {
    const error = new HttpError("Unautorizhed", 401);
    return next(error);
  }
  try {
    forms = await Help.find({ user: userId });
  } catch (err) {
    const error = new HttpError(
      "Fetching products failed, please try again",
      500
    );
    return next(error);
  }
  if (!forms || forms.length === 0) {
    return next(
      new HttpError("No se han encontrado resultados para su consulta", 404)
    );
  }
  res.json({
    forms: forms.map((form) => form.toObject({ getters: true })),
  });
};

const getUserCart = async (req, res, next) => {
  const userId = req.userData.userId;
  let user;
  try {
    user = await User.findById({ _id: userId }, "cart").populate(
      "cart.cartItem.product",
      "stats.price stats.format name image"
    );
  } catch (err) {
    const error = new HttpError(
      "No se han podido obtener los datos del usuario",
      500
    );
    return next(error);
  }
  if (!user) {
    const error = new HttpError(
      "No se ha encontrado un usuario para el id proporcionado.",
      404
    );
    return next(error);
  }

  try {
    await checkRol(req.userData.userId, user.id);
  } catch (err) {
    const error = new HttpError("Unautorizhed", 401);
    return next(error);
  }

  res.json({ user: user.toObject({ getters: true }) });
};

const deleteCartItem = async (req, res, next) => {
  const productId = req.params.pid;
  const userId = req.userData.userId;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find a user for this id", 404); // check si existe el id
    return next(error);
  }

  try {
    await checkRol(req.userData.userId, user.id);
  } catch (err) {
    const error = new HttpError("Unautorizhed", 401);
    return next(error);
  }

  user.cart.cartItem = user.cart.cartItem.filter(
    (obj) => obj.product.toString() !== productId
  );

  console.log(user.cart.cartItem.product);
  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(200).json({ message: "Deleted product." });
};

exports.deleteCartItem = deleteCartItem;
exports.getUserCart = getUserCart;
exports.createRol = createRol;
exports.getUserById = getUserById;
exports.updateUser = updateUser;
exports.updatePass = updatePass;
exports.getUsers = getUsers;
exports.getVendors = getVendors;
exports.signup = signup;
exports.login = login;
exports.getAuth = getAuth;
exports.setSeller = setSeller;
exports.addaddToUserCart = addToUserCart;
