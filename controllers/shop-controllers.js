const { validationResult } = require("express-validator");
const fs = require("fs");
const HttpError = require("../models/http-error");
const Shop = require("../models/shop");
const Market = require("../models/market");
const User = require("../models/user");
const checkRol = require("../util/checkRol");
const getPagination = require("../util/pagination");
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
  const { limit, offset } = getPagination(req.params.page, req.params.size);
  const ifName = req.params.nam !== "shop" ? req.params.nam : " ";
  let totalItems;
  let totalShops;

  let shops;
  try {
    totalItems = await Shop.countDocuments({});
    totalShops = await Shop.countDocuments({
      $and: [
        {
          $or: [
            { name: { $regex: ifName, $options: "i" } },
            { type: { $regex: ifName, $options: "i" } },
            { description: { $regex: ifName, $options: "i" } },
          ],
        },
        { marketo: marketId },
      ],
    });
    shops = await Shop.find({
      $and: [
        {
          $or: [
            { name: { $regex: ifName, $options: "i" } },
            { type: { $regex: ifName, $options: "i" } },
            { description: { $regex: ifName, $options: "i" } },
          ],
        },
        { marketo: marketId },
      ],
    })
      .skip(offset)
      .limit(limit);
  } catch (err) {
    const error = new HttpError("Fetching shops failed, please try again", 500);
    return next(error);
  }
  if (!shops || shops.length === 0) {
    return next(
      new HttpError("Could not find a Shops for the provided Market id.", 404)
    );
  }
  res.json({
    totalPages: Math.ceil(totalShops / limit),
    totalItems: totalItems,
    limit: limit,
    currentPageSize: shops.length,
    shops: shops.map((shop) => shop.toObject({ getters: true })),
  });
};

const getShopByOwnerId = async (req, res, next) => {
  const ownerId = req.params.oid;

  let shops;
  try {
    shops = await Shop.find({ owner: ownerId });
  } catch (err) {
    const error = new HttpError("Fetching shops failed, please try again", 500);
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
    next(new HttpError(" Invalid inputs passed, please check your data", 422));
  }

  const { name, type, description, location, owner, marketo } = req.body;

  const createdShop = new Shop({
    name,
    type,
    description,
    location,
    active: false,
    image: req.file.path,
    owner,
    marketo,
    products: [],
    reviews: [],
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

  if (!user) {
    const error = new HttpError(
      " Could not find user or market for provided id",
      404
    );
    return next(error);
  }
  if (!market) {
    const error = new HttpError(
      " Could not find user or market for provided id",
      404
    );
    return next(error);
  }
  console.log(createdShop);
  console.log(user);
  console.log(market);
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdShop.save({ session: sess });
    user.shop = createdShop;
    market.shops.push(createdShop);
    await user.save({ session: sess });
    await market.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(201).json({ shop: createdShop.toObject({ getters: true }) }); //exito en sv
};

const updateShopById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(" Invalid inputs passed, please check your data", 422)
    );
  }

  const { name, description, location, imageup } = req.body;
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
  shop.location = location;

  const imagePath = shop.image;
  if (imageup === "true") {
    shop.image = req.file.path;
  }
  try {
    await shop.save();
    if (imageup === "true") {
      fs.unlink(imagePath, (err) => {});
    }
  } catch (err) {
    const error = new HttpError(
      "No se ha podido actualizar el Puesto, intentelo de nuevo",
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
    shop = await await Shop.findById(shopId).populate("marketo owner"); // borrar con referencia
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

const openShop = async (req, res, next) => {
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
  if (!shop) {
    const error = new HttpError("Could not find a shop for this id", 404); // check si existe el id
    return next(error);
  }

  try {
    await checkRol(req.userData.userId, shop.owner.toString());
  } catch (err) {
    return next(err);
  }

  if (shop.active === true) {
    shop.active = false;
  } else {
    shop.active = true;
  }

  try {
    await shop.save();
  } catch (err) {
    const error = new HttpError(
      "No se ha podido actualizar el Puesto, intentelo de nuevo",
      500
    );
    return next(error);
  }
  res
    .status(200)
    .json({ message: "El estado de la tienda se ha actualizado." });
};

exports.getShops = getShops;
exports.getShopById = getShopById;
exports.getShopByMarketId = getShopByMarketId;
exports.getShopByOwnerId = getShopByOwnerId;
exports.createShop = createShop;
exports.updateShopById = updateShopById;
exports.deleteShopById = deleteShopById;
exports.openShop = openShop;
