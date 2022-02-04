const User = require("../models/user");
const Rol = require("../models/rol");
const HttpError = require("../models/http-error");
const mongoose = require("mongoose");

async function checkRol(userDataId, userid) {
  let checkRol;
  let rol;
  console.log(userid)
  try {
    checkRol = await User.findById(userDataId);
    rol = await Rol.findById(checkRol.rol);
  } catch (err) {
    console.log(err)
    const error = new HttpError(
      err,
      401
    );
    return next(error);
  }
  if (userid !== userDataId && rol.isAdmin === false) {
    // autorizacion  via token
    console.log(userid, userDataId )
    const error = new HttpError("aqui", 401);
    return next(error);
  }
}

module.exports = checkRol;
