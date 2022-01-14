const express = require("express");

const { check } = require("express-validator");

const marketControllers = require("../controllers/market-controllers");

const router = express.Router();

router.get("/", marketControllers.getMarkets);

router.get("/:mid", marketControllers.getMarketById);

router.post(
  "/",
  [
    check("name").not().isEmpty(),
    check("postalCode").isLength(5),
    check("address").not().isEmpty(),
  ],
  marketControllers.createMarket
);


module.exports = router;
