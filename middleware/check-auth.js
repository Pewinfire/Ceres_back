const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") { // browser por convencion bloquea option request 
    return next();
  }
  try {
    const token = req.headers.authorization.split(" ")[1]; // bearer token
    if (!token) {
      throw new Error("Authentication failed"); //error en el header, en el split
    }

    const decodedToken = jwt.verify(token, "private_key_1");
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    const error = new HttpError("Authentication failed!", 403); //error en el propio token
    return next(error);
  }
};
