const fs = require("fs");
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
  const address = req.params.addr;

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
          $maxDistance: 3000,
          $geometry: geoJson,
        },
      },
    });
  } catch (err) {
    const error = new HttpError(err, 500);
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
    image: req.file.path,
    address,
    location: coordinates,
    geoSon,
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

const updateMarketById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
  
    return next(
      new HttpError(" Invalid inputs passed, please check your data", 422)
    );
  }

  const { name, postalCode, address, imageup } = req.body;
  const marketId = req.params.mid;

  let market;

  try {
    market = await Market.findById(marketId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update market",
      500
    );
    return next(error);
  }

  /*   if (market.creator.toString() !== req.userData.userId) {
    // autorizacion  via token
    const error = new HttpError("You are not allowed to edit the post", 401);
    return next(error);
  } */

  market.name = name;
  market.postalCode = postalCode;
  market.address = address;

  let coordinates;
  let geoJSon;
  try {
    coordinates = await getCoordsForAddress(address);
    geoJSon = {
      type: "Point",
      coordinates: [coordinates.lng, coordinates.lat],
    };
  } catch (error) {
    return next(error);
  }
  (market.location = coordinates), (market.geoSon = geoJSon);
  const imagePath = market.image;
  if (imageup === "true") {
    market.image = req.file.path;
  }
  try {
    await market.save();

    if (imageup === "true") {
      fs.unlink(imagePath, (err) => {
      
      });
    }
  } catch (err) {
    const error = new HttpError(
      "No se ha podido actualizar el Mercado, intentelo de nuevo",
      500
    );
    return next(error);
  }

  res.status(200).json({ market: market.toObject({ getters: true }) });
};

exports.updateMarketById = updateMarketById;
exports.getMarkets = getMarkets;
exports.getMarketsNear = getMarketsNear;
exports.createMarket = createMarket;
exports.getMarketById = getMarketById;
