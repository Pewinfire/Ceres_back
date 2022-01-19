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

const getMarketsNear = async (req, res, next) => {
 /*  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(" Invalid inputs passed, please check your data", 422)
    );
  }
  const { address } = req.body; */
  const address = req.params.addr;
  console.log(address);
  let coordinates;
  let geoJson;
  try {
    coordinates = await getCoordsForAddress(address);
    geoJson = {
      type: "Point",
      coordinates: [coordinates.lng, coordinates.lat],
    };
  } catch (error) {
    return next(error);
  }
  console.log(geoJson);
  let markets;
  try {
    
    markets = await Market.find({
      geoSon: {
        $near: {
          $maxDistance: 10000,
          $geometry: geoJson,
        },
      },
    });
  } catch (err) {
    const error = new HttpError(
      err,
      500
    );
    return next(error);
  }
  res.json({
    markets: markets.map((market) => market.toObject({ getters: true })),
  });
};

const getMarketById = async (req, res, next) => {
  const marketId = req.params.mid;
  let market;
  try {
    
    market = await Market.findById(marketId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a market",
      500
    );
    return next(error);
  }

  if (!market) {
    const error = new HttpError(
      "Could not find a market for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ market: market.toObject({ getters: true }) });
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
  let geoSon;
  try {
    coordinates = await getCoordsForAddress(address);
    geoSon = {
      type: "Point",
      coordinates: [coordinates.lng, coordinates.lat],
    };
  } catch (error) {
    return next(error);
  }
  const createdMarket = new Market({
    name,
    postalCode,
    image: "https://imag.bonviveur.com/exterior-del-mercado-de-ruzafa.jpg",
    address,
    location: coordinates,
    geoSon,
    shop: [],
  });
  console.log(createdMarket.location);
  try {
    await createdMarket.save();
  } catch (err) {
    const error = new HttpError("Signinp Up failed, please try again", 500);
    return next(error);
  }

  res.status(201).json({ market: createdMarket.toObject({ getters: true }) }); //exito en sv
};

exports.getMarkets = getMarkets;
exports.getMarketsNear = getMarketsNear;
exports.createMarket = createMarket;
exports.getMarketById = getMarketById;
