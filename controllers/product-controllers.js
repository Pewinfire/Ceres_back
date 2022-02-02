const { validationResult } = require("express-validator");
const fs = require("fs");
const HttpError = require("../models/http-error");
const Product = require("../models/product");
const Category = require("../models/category");
const Shop = require("../models/shop");
const mongoose = require("mongoose");

/////////////////////////////////////////Get//////////////////////////////

const getProducts = async (req, res, next) => {
  let products;
  try {
    products = await Product.find().populate("categories");
  } catch (err) {
    const error = new HttpError(
      "Fetching puestos failed, please try again.",
      500
    );
    return next(error);
  }

  res.json({
    products: products.map((products) => products.toObject({ getters: true })),
  });
};

const getProductById = async (req, res, next) => {
  const productId = req.params.pid;
  let product;
  try {
    product = await Product.findById(productId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a product",
      500
    );
    return next(error);
  }

  if (!product) {
    const error = new HttpError(
      "Could not find a product for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ product: product.toObject({ getters: true }) });
};

const getProductByCategoryId = async (req, res, next) => {
  const categoryId = req.params.cid;

  let products;
  try {
    products = await Product.find({ categories: categoryId });
  } catch (err) {
    const error = new HttpError(
      "Fetching products failed, please try again",
      500
    );
    return next(error);
  }
  if (!products || products.length === 0) {
    return next(
      new HttpError(
        "Could not find a Products for the provided Market id.",
        404
      )
    );
  }
  res.json({
    products: products.map((product) => product.toObject({ getters: true })),
  });
};

const getProductByShopId = async (req, res, next) => {
  const shopId = req.params.shid;

  let products;
  try {
    products = await Product.find({ Shop: shopId }).populate();
  } catch (err) {
    const error = new HttpError(
      "Fetching products failed, please try again",
      500
    );
    return next(error);
  }
  if (!products || products.length === 0) {
    return next(
      new HttpError("Could not find products for the provided Shop id.", 404)
    );
  }
  res.json({
    products: products.map((product) => product.toObject({ getters: true })),
  });
};

/////////////////////////////////////////Create//////////////////////////////

const createProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new HttpError(" Invalid inputs passed, please check your data", 422));
  }

  const { name, categories, shop } = req.body;

  const createdProduct = new Product({
    name,
    categories,
    shop,
  
  });
  let cats;
  let shopo;
  try {
    cats = await Category.find({ _id: { $in: categories } });
    shopo = await Shop.findById(shop);
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!cats && cats.length === 0 && cats.length !== categories.length) {
    const error = new HttpError(
      " Could not find a category for provided id",
      404
    );
    return next(error);
  }
  let category;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdProduct.save({ session: sess });
    shopo.products.push(createdProduct);
    await shopo.save({ session: sess });
    for (let cat of cats) {
      category = await Category.findById(cat);
      category.products.push(createdProduct);
      await category.save({ session: sess });
    }
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(201).json({ product: createdProduct.toObject({ getters: true }) }); //exito en sv
};

const updateProductById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(" Invalid inputs passed, please check your data", 422)
    );
  }

  const { name, categories } = req.body;
  const productId = req.params.pid;

  let product;
  try {
    product = await Product.findById(productId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update Product",
      500
    );
    return next(error);
  }

  /*   if (product.creator.toString() !== req.userData.userId) {
    // autorizacion  via token
    const error = new HttpError("You are not allowed to edit the post", 401);
    return next(error);
  } */
  product.name = name;
  try {
    cats = await Category.find({ _id: { $in: categories } });
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }
  if (!cats && cats.length === 0 && cats.length !== categories.length) {
    const error = new HttpError(
      " Could not find a category for provided id",
      404
    );
    return next(error);
  }
  let catAd;
  let catAdd;
  let catRemove;

  try {
    catRemove = await product.categories.filter(
      (cat) => !categories.includes(cat.toString())
    );
    catAd = await categories.filter(
      (cat) => !product.categories.toString().includes(cat)
    );
    catAdd = catAd.map((s) => mongoose.Types.ObjectId(s));
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  product.categories = cats;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await product.save({ session: sess });
    for (let catR of catRemove) {
      category = await Category.findById(catR);
      category.products.pull(product);
      await category.save({ session: sess });
    }
    for (let catA of catAdd) {
      category = await Category.findById(catA);
      category.products.push(product);
      await category.save({ session: sess });
    }
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }
  res.status(200).json({ product: product.toObject({ getters: true }) });
};

const deleteProductById = async (req, res, next) => {
  const productId = req.params.pid;

  let product;
  try {
    product = await Product.findById(productId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete product.",
      500
    );
    return next(error);
  }

  if (!product) {
    const error = new HttpError("Could not find a product for this id", 404); // check si existe el id
    return next(error);
  }

  /*   if (product.creator.id !== req.userData.userId) {
    // autorizacion  via token
    const error = new HttpError("You are not allowed to delete the post", 401);
    return next(error);
  } 

  const imagePath = product.image;
*/

  let category;
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    for (let cat of product.categories) {
      category = await Category.findById(cat);
      category.products.pull(product);
      await category.save({ session: sess });
    }
    await product.remove({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(200).json({ message: "Deleted product." });
};

exports.getProducts = getProducts;
exports.getProductById = getProductById;
exports.createProduct = createProduct;
exports.getProductByCategoryId = getProductByCategoryId;
exports.getProductByShopId = getProductByShopId;
exports.updateProductById = updateProductById;
exports.deleteProductById = deleteProductById;
