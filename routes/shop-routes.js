const express = require("express");

const { check } = require("express-validator");

const shopControllers = require("../controllers/shop-controllers");
const shop = require("../models/shop");

const router = express.Router();

router.get("/", shopControllers.getShops);

router.post(
    "/",
    [
      check("name").not().isEmpty(),
      check("description").not().isEmpty(),
      check("location").not().isEmpty(),
    ],
  shopControllers.createShop
);

/* router.patch(
  "/:mid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],  // solo la imagen 
  placesControllers.updatePlaceById
); // validacion


router.delete("/:pid", placesControllers.deletePlaceById);*/

module.exports = router;
