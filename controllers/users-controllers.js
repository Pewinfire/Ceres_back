const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const HttpError = require("../models/http-error");
const User = require("../models/user");
const Rol = require("../models/rol");
const Reviews = require("../models/reviews");
const Shop = require("../models/shop");
const mongoose = require("mongoose");

//user

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
  }); //exito en sv
};

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

  if (user.id !== req.userData.userId) {
    // autorizacion  via token
    const error = new HttpError("Unautorizhed", 401);
    return next(error);
  }

  /*   let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(oldpassword, user.password); // no recrea el encriptado, comprueba la posibilidad de haberlo creado el. Booleano
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
 */
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

// admin

const createRol = async (req, res, next) => {
  //desactivada de rutas, no se va a usar
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

const getUserById = async (req, res, next) => {
  const userId = req.params.uid;
  let user;
  try {
    user = await User.findById(
      { _id: userId },
      "-password -cart -orders -reviews -shop "
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

  let checkRol;
  let rol;
  try {
    checkRol = await User.findById(req.userData.userId);
    rol = await Rol.findById(checkRol.rol);
  } catch (err) {
    const error = new HttpError(
      "Token manipulado, se creara un registro del problema",
      401
    );
    return next(error);
  }
  console.log(rol.isAdmin);
  console.log(rol.isAdmin !== false);
  if (user.id !== req.userData.userId && rol.isAdmin === false) {
    // autorizacion  via token
    const error = new HttpError("Unautorizhed", 401);
    return next(error);
  }

  res.json({ user: user.toObject({ getters: true }) });
};

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password -cart -bill -shops");
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

exports.createRol = createRol;
exports.getUserById = getUserById;
exports.updateUser = updateUser;
exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
