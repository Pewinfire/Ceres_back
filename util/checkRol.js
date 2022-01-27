const User = require("../models/user");
const Rol = require("../models/rol");
const HttpError = require("../models/http-error");
const mongoose = require("mongoose");

async function checkRol(userDataId, userid) {
  let checkRol;
  let rol;
  try {
    checkRol = await User.findById(userDataId);
    rol = await Rol.findById(checkRol.rol);
  } catch (err) {
    const error = new HttpError(
      "Token manipulado, se creara un registro del problema",
      401
    );
    return next(error);
  }
  if (userid !== userDataId && rol.isAdmin === false) {
    // autorizacion  via token
    const error = new HttpError("Unautorizhed", 401);
    return next(error);
  }
}

async function checkRol(userDataId, userid) {
    let checkRol;
    let rol;
    try {
      checkRol = await User.findById(userDataId);
      rol = await Rol.findById(checkRol.rol);
    } catch (err) {
      const error = new HttpError(
        "Token manipulado, se creara un registro del problema",
        401
      );
      return next(error);
    }
    if (userid !== userDataId && rol.isAdmin === false) {
      // autorizacion  via token
      const error = new HttpError("Unautorizhed", 401);
      return next(error);
    }
  }
  
module.exports = checkRol;
