const express = require("express");

const { check } = require("express-validator");

const marketControllers = require("../controllers/market-controllers");
const fileUpload = require("../middleware/file-upload");

const router = express.Router();
/* 
router.get("/", marketControllers.getMarkets); */

router.get(
  "/near/:addr",
  /* [
  check("address").not().isEmpty(),
], */ marketControllers.getMarketsNear
);

router.get("/:mid", marketControllers.getMarketById);

router.get("/name/:page/:size/:nam", marketControllers.getMarkets);


router.patch(
  "/:mid",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("postalCode").isLength(5),
    check("address").not().isEmpty(),
  ],
  marketControllers.updateMarketById
);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("postalCode").isLength(5),
    check("address").not().isEmpty(),
  ],
  marketControllers.createMarket
);

module.exports = router;
