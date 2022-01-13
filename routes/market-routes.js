const express = require("express");

const { check } = require("express-validator");

const marketControllers = require("../controllers/market-controllers");
const market = require("../models/market");

const router = express.Router();

router.get("/", marketControllers.getMarkets);

router.post(
    "/",
    [
      check("name").not().isEmpty(),
      check("postalCode").isLength(5),
      check("address").not().isEmpty(),
    ],
  marketControllers.createMarket
);
/* 
router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesControllers.updatePlaceById
); // validacion

router.delete("/:pid", placesControllers.deletePlaceById); */

module.exports = router;
