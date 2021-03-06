const express = require("express");

const { check } = require("express-validator");
const checkAuth = require("../middleware/check-auth");
const shopControllers = require("../controllers/shop-controllers");
const router = express.Router();
const fileUpload = require("../middleware/file-upload");

router.get("/", shopControllers.getShops);

router.get("/:shid", shopControllers.getShopById);

router.get("/market/:mid/:page/:size/:nam", shopControllers.getShopByMarketId);

router.get("/owner/:oid", shopControllers.getShopByOwnerId);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("description").not().isEmpty(),
    check("location").not().isEmpty(),
  ],
  shopControllers.createShop
);

router.patch(
  "/:shid",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("description").not().isEmpty(),
    check("location").not().isEmpty(),
  ], // solo la imagen
  shopControllers.updateShopById
); // validacion


        router.use(checkAuth);
        router.patch(
          "/status/:shid",
          shopControllers.openShop
        );

router.delete("/:shid", shopControllers.deleteShopById);

module.exports = router;
