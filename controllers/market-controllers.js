const fs = require("fs");
const { validationResult } = require("express-validator");
const getCoordsForAddress = require("../util/location");
const HttpError = require("../models/http-error");
const Market = require("../models/market");
const getPagination = require("../util/pagination");

const getMarkets = async (req, res, next) => {
  // parametros page, size, calcula paginacion /filter de la url, pequeña condicion para filtro vacio
  const { limit, offset } = getPagination(req.params.page, req.params.size);
  const ifName = req.params.nam !== "merca" ? req.params.nam : " ";
  let markets;
  let totalItems;
  let totalMarkets;
  // cuenta mercados , cuenta mercados aplicando filtro (para paginacion), busqueda de mercados aplicando filtro y paginacion
  try {
    totalItems = await Market.countDocuments({});
    totalMarkets = await Market.countDocuments({
      $or: [
        { name: { $regex: ifName, $options: "i" } },
        { address: { $regex: ifName, $options: "i" } },
      ],
    });
    markets = await Market.find(
      {
        $or: [
          { name: { $regex: ifName, $options: "i" } },
          { address: { $regex: ifName, $options: "i" } },
        ],
      },
      // no devuelve el campo array de tiendas ( podemos elegir que campos devuelve)
      "-shops"
    )
      .skip(offset)
      .limit(limit);
  } catch (err) {
    const error = new HttpError(
      // errror en la busqueda
      "No se han introducido caracteres válidos",
      500
    );
    return next(error);
  }
  //si resultado vacio
  if (!markets) {
    const error = new HttpError(
      " No se han encontrado resultados para su busqueda",
      404
    );
    return next(error);
  }
  // respuesta 
  res.json({
    totalPages: Math.ceil(totalMarkets / limit),
    totalItems: totalItems,
    limit: limit,
    currentPageSize: markets.length,
    markets: markets.map((market) => market.toObject({ getters: true })),
  });
};

const getMarketsNear = async (req, res, next) => {
  const { limit, offset } = getPagination(req.params.page, req.params.size);
  const ifName = req.params.nam !== "merca" ? req.params.nam : " ";
  const address = req.params.addr;
  let coordinates;
  let geoJson;
  let markets;
  let totalItems;
  let totalMarkets;
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
  try {
    totalItems = await Market.countDocuments({});
    totalMarkets = await Market.countDocuments({
      $and: [
        {
          $or: [
            { name: { $regex: ifName, $options: "i" } },
            { address: { $regex: ifName, $options: "i" } },
          ],
        },
        {
          $geoWithin: { $center: [[coordinates.lng, coordinates.lat], 1500] },
        },
      ],
    });

    markets = await Market.find(
      {
        $and: [
          {
            $or: [
              { name: { $regex: ifName, $options: "i" } },
              { address: { $regex: ifName, $options: "i" } },
            ],
          },
          {
            geoSon: {
              $near: {
                $maxDistance: 3000,
                $geometry: geoJson,
              },
            },
          },
        ],
      },
      "-shops"
    )
      .skip(offset)
      .limit(limit);
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }
  res.json({
    totalPages: Math.ceil(totalMarkets / limit) - 1,
    totalItems: totalItems,
    limit: limit,
    currentPageSize: markets.length,
    markets: markets.map((market) => market.toObject({ getters: true })),
  });
};

const getMarketById = async (req, res, next) => {
  const marketId = req.params.mid;
  let market;
  try {
    market = await Market.findById(marketId);
  } catch (err) {
    const error = new HttpError(err, 500);
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
    const error = new HttpError(err, 500);
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
      fs.unlink(imagePath, (err) => {});
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
