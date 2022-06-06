const express = require("express");

const { check } = require("express-validator");
const checkAuth = require("../middleware/check-auth");
const usersControllers = require("../controllers/users-controllers");
const fileUpload = require("../middleware/file-upload");
const router = express.Router();

//users
router.patch("/emptycart/:uid", usersControllers.emptyCartByUserId);

router.get(
  "/orders/client/:uid/:page/:size/:nam",
  usersControllers.getOrdersByClient
);
router.get(
  "/orders/vendor/:sid/:page/:size/:nam",
  usersControllers.getOrdersByVendor
);
router.get("/order/:oid", usersControllers.getOrders);
router.get("/get/order/:oid", usersControllers.getOrder);
router.get("/pedido/:pid", usersControllers.getPedido);
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
    check("province").not().isEmpty(),
    check("locality").not().isEmpty(),
    check("postalCode").not().isEmpty(),
  ],
  usersControllers.signup
);

router.post("/login", usersControllers.login);
router.use(checkAuth);
router.get("/getall/:page/:size/:sch/:sort/:dir", usersControllers.getUsers);
router.get("/vendors/", usersControllers.getVendors);
router.get("/:uid", usersControllers.getUserById);
router.get("/auth/checkrol", usersControllers.getAuth);
router.get("/accept/order/:oid", usersControllers.acceptOrder);
router.get("/cancel/order/:oid", usersControllers.cancelOrder);
router.patch(
  "/:uid",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("lastname").not().isEmpty(),
    check("dni").not().isEmpty(),
    check("phone").isNumeric(),
    check("address").not().isEmpty(),
    check("province").not().isEmpty(),
    check("locality").not().isEmpty(),
    check("postalCode").not().isEmpty(),
  ],
  usersControllers.updateUser
);

router.post("/makeOrder", usersControllers.makeOrder);

router.patch(
  "/address/:uid",
  [
    check("address").not().isEmpty(),
    check("locality").not().isEmpty(),
    check("postalCode").not().isEmpty(),
    check("province").not().isEmpty(),
  ],
  usersControllers.updateAddress
);

router.patch(
  "/pass/:uid",
  [check("password").not().isEmpty(), check("oldPassword").not().isEmpty()],
  usersControllers.updatePass
);

router.patch(
  "/cart/addto",
  [
    check("productId").not().isEmpty(),
    check("shopId").not().isEmpty(),
    check("productSize").not().isEmpty(),
  ],
  usersControllers.addaddToUserCart
);

router.patch("/setrol/setseller/:uid", usersControllers.setSeller);

router.patch("/cart/deleteItem/:pid", usersControllers.deleteCartItem);

router.get("/cart/get", usersControllers.getUserCart);

module.exports = router;
