const express = require("express");

const { check } = require("express-validator");
const checkAuth = require("../middleware/check-auth");
const usersControllers = require("../controllers/users-controllers");
const fileUpload = require("../middleware/file-upload");
const router = express.Router();


router.get("/", usersControllers.getUsers);

//users

router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("lastname").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
    check("dni").not().isEmpty(),
    check("phone").isNumeric(),
    check("address").not().isEmpty(),
  ],
  usersControllers.signup
);

router.post("/login", usersControllers.login);


router.use(checkAuth);
router.get("/:uid", usersControllers.getUserById);

router.patch(
  "/:uid",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("lastname").not().isEmpty(),
    check("dni").not().isEmpty(),
    check("phone").isNumeric(),
    check("address").not().isEmpty(),
  ],
  usersControllers.updateUser
);

module.exports = router;
