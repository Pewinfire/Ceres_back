const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const Shop = require("../models/shop");
const Market = require("../models/market");
const User = require("../models/user");
const mongoose = require("mongoose");

/////////////////////////////////////////Get//////////////////////////////

const getShops = async (req, res, next) => {
  let shops;
  try {
    shops = await Shop.find({});
  } catch (err) {
    const error = new HttpError(
      "Fetching puestos failed, please try again.",
      500
    );
    return next(error);
  }
  res.json({
    shops: shops.map((shops) => shops.toObject({ getters: true })),
  });
};

const getShopById = async (req, res, next) => {
  const shopId = req.params.shid;
  let shop;
  try {
    shop = await Shop.findById(shopId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a shop", 
      500
    );
    return next(error);
  }

  if (!shop) {
    const error = new HttpError(
      "Could not find a shop for the provided id.",
      404
    ); 
    return next(error);
  }

  res.json({ shop: shop.toObject({ getters: true }) });
};

const getShopByMarketId = async (req, res, next) => {
  const marketId = req.params.mid;

  let shops;
  try {
    shops = await Shop.find({ market: marketId }); 
  } catch (err) {
    const error = new HttpError(
      "Fetching shops failed, please try again",
      500
    );
    return next(error);
  }
  if (!shops || shops.length === 0) {
    return next(
      new HttpError("Could not find a Shops for the provided Market id.", 404)
    );
  }
  res.json({
    shops: shops.map((shop) => shop.toObject({ getters: true })),
  }); 
};

const getShopByOwnerId = async (req, res, next) => {
    const ownerId = req.params.oid;
  
    let shops;
    try {
      shops = await Shop.find({ owner: ownerId }); 
    } catch (err) {
      const error = new HttpError(
        "Fetching shops failed, please try again",
        500
      );
      return next(error);
    }
    if (!shops || shops.length === 0) {
      return next(
        new HttpError("Could not find a Shops for the provided Owner id.", 404)
      );
    }
    res.json({
      shops: shops.map((shop) => shop.toObject({ getters: true })),
    }); 
  };
  
/////////////////////////////////////////Create//////////////////////////////

const createShop = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    next(new HttpError(" Invalid inputs passed, please check your data", 422));
  }

  const {name, description, location, owner, marketo } = req.body;

 
  const createdShop = new Shop({
    name, 
    description,
    location,
    image:
      "https://www.visitvalencia.com/sites/default/files/styles/gallery_default/public/media/media-images/images/Mercado-de-Ruzafa-VV-02649_1024-%20Foto_Estudio_Calpena.jpg?itok=3aHaVdzS",
    owner,
    marketo
  });

  let user;
  let market;
  try {
    user = await User.findById(owner);
    market = await Market.findById(marketo);
  } catch (err) {
    const error = new HttpError("Creating shop failed, try again", 500);
    return next(error);
  }

  if (!user && !market) {
    const error = new HttpError(" Could not find user or market for provided id", 404);
    return next(error);
  }

 try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdShop.save({ session: sess });
    user.shops.push(createdShop); 
    market.shops.push(createdShop); 
    await user.save({ session: sess });
    await market.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(market.shop, 500);
    return next(error);
  }

  res.status(201).json({ shop: createdShop.toObject({ getters: true }) }); //exito en sv
};


const updateShopById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError(" Invalid inputs passed, please check your data", 422)
    );
  }

  const {name, description, location} = req.body;
  const shopId = req.params.shid;

  let shop;
  try {
    shop = await Shop.findById(shopId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update shop",
      500
    );
    return next(error);
  }
//img
  shop.name = name;
  shop.description = description;

  try {
    await shop.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update shop",
      500
    );
    return next(error);
  }

  res.status(200).json({ shop: shop.toObject({ getters: true }) });
};

const deleteShopById = async (req, res, next) => {
  const shopId = req.params.shid;

  let shop;
  try {
    shop = await (await Shop.findById(shopId).populate("marketo owner")); // borrar con referencia
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete shop.",
      500
    );
    return next(error);
  }

  if (!shop) {
    const error = new HttpError("Could not find a shop for this id", 404); // check si existe el id
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await shop.remove({ session: sess }); 
    shop.owner.shops.pull(shop); 
    await shop.owner.save({ session: sess }); 
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete shop.",
      500
    );
    return next(error);
  }
  res.status(200).json({ message: "Deleted shop." });
};

exports.getShops = getShops;
exports.getShopById = getShopById;
exports.getShopByMarketId = getShopByMarketId;
exports.getShopByOwnerId = getShopByOwnerId;
exports.createShop = createShop;
exports.updateShopById = updateShopById;
exports.deleteShopById = deleteShopById;
