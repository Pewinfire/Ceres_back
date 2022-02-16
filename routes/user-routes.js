const express = require("express");

const { check } = require("express-validator");
const checkAuth = require("../middleware/check-auth");
const usersControllers = require("../controllers/users-controllers");
const fileUpload = require("../middleware/file-upload");
const router = express.Router();



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
router.get("/getall/:page/:size/:sch/:sort/:dir", usersControllers.getUsers);
router.get("/vendors/", usersControllers.getVendors);
router.get("/:uid", usersControllers.getUserById);
router.get("/auth/checkrol", usersControllers.getAuth);
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
router.patch(
  "/pass/:uid",
  [check("password").not().isEmpty(), check("oldPassword").not().isEmpty()],
  usersControllers.updatePass
);
router.patch(
  "/cart/addto",
  [check("productId").not().isEmpty(), check("productSize").not().isEmpty()],
  usersControllers.addaddToUserCart
);

router.patch(
  "/setrol/setseller/:uid",
  usersControllers.setSeller
);

router.patch("/cart/deleteItem/:pid", usersControllers.deleteCartItem);

router.get("/cart/get", usersControllers.getUserCart);

module.exports = router;
