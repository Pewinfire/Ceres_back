const { validationResult } = require("express-validator");
const getCoordsForAddress = require("../util/location");
const HttpError = require("../models/http-error");
const Market = require("../models/market");

const getMarkets = async (req, res, next) => {
  let markets;
  try {
    markets = await Market.find({});
  } catch (err) {
    const error = new HttpError(
      "Fetching markets failed, please try again.",
      500
    );
    return next(error);
  }
  res.json({
    markets: markets.map((market) => market.toObject({ getters: true })),
  });
};

const createMarket = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(" Invalid inputs passed, please check your data", 422)
    );
  }
  const { name, postalCode, address } = req.body;

  let existingMarket;
  try {
    existingMarket = await Market.findOne({ name: name });
  } catch (err) {
    const error = new HttpError(
      "Ha ocurrido un error al intentar registrar el mercado, intentalo de nuevo",
      500
    );
    return next(error);
  }

  if (existingMarket) {
    const error = new HttpError("El Mercado introducido ya existe", 422);
    return next(error);
  }

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }
  const createdMarket = new Market({
    name,
    postalCode,
    image: "https://imag.bonviveur.com/exterior-del-mercado-de-ruzafa.jpg",
    address,
    location: coordinates,
    shop: [],
  });

  try {
    await createdMarket.save();
  } catch (err) {
    const error = new HttpError("Signinp Up failed, please try again", 500);
    return next(error);
  }

  res.status(201).json({ market: createdMarket.toObject({ getters: true }) }); //exito en sv
};

exports.getMarkets = getMarkets;
exports.createMarket = createMarket;
