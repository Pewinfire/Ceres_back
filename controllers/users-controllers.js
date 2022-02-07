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
const checkRol = require("../util/checkRol");

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
  let users;
  try {
    users = await User.find({}, "-password -cart -bill -shops").populate("rol" , "rol -_id id");
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
/*   try {
    await checkRol(req.userData.userId, "1231231232");
  } catch (err) {
    const error = new HttpError("Unautorizhed", 401);
    return next(error);
  } */
  const { userId } = req.body;
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
  let newRol;
  let oldRol = user.rol;
  let ifSeller = user.rol.toString() === "61f139f39f9766acbd29b447" ? "61f139ed9f9766acbd29b445" : "61f139f39f9766acbd29b447"
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
  console.log(newRol, oldRol)
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
