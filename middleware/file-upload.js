const multer = require("multer");
const {v1 :uuidv1} = require("uuid");
const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};
const fileUpload = multer({
  limits: 500000, //5h bytes
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/images");
    },
    filename: (req, file, cb) => {
      const ext = MIME_TYPE_MAP[file.mimetype]; //recoge la extension .
      cb(null, uuidv1() + "." + ext); //callback y genera nombre random con extension correcta por multer
    },
  }),
  fileFilter: (req, file, cb) => {
    //validacion
    const isValid = !!MIME_TYPE_MAP[file.mimetype]; // doble !! reconvierte undefined o nulo a falso. si coge resultado convierte a true
    let error = isValid ? null : new Error("Invalid mime type");
    cb(error, isValid);
  },
});

module.exports = fileUpload;
