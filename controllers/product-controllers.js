const { validationResult } = require("express-validator");
const fs = require("fs");
const HttpError = require("../models/http-error");
const Product = require("../models/product");
const Category = require("../models/category");

const mongoose = require("mongoose");
const user = require("../../../MERN/udemy cursos/Yourplaces/Yourplaces_bck/models/user");

/////////////////////////////////////////Get//////////////////////////////

const getProducts = async (req, res, next) => {
  let products;
  try {
    products = await Product.find({});
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
    products = await Product.find({ Shop: shopId });
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

  const { name, categories } = req.body;

  const createdProduct = new Product({
    name,
    categories,
  });
  let cats;
  try {
    cats = await Promise.all(
      categories.map(async (category) => {
        return await Category.findById(category);
      })
    );
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
  const productId = req.params.shid;

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


  let cats = [...new Set(categories)];
  console.log(categories)
  /* 
  product.name = name;
  product.description = description;
  product.location = location;

  const imagePath = product.image;
  if (imageup === "true") {
    product.image = req.file.path;
  }
  try {
    await product.save();

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

  res.status(200).json({ product: product.toObject({ getters: true }) }); */
};
/* const deleteProductById = async (req, res, next) => {
  const productId = req.params.shid;

  let product;
  try {
    product = await await Product.findById(productId).populate("marketo owner"); // borrar con referencia
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

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await product.remove({ session: sess });
    product.owner.products.pull(product);
    await product.owner.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete product.",
      500
    );
    return next(error);
  }
  res.status(200).json({ message: "Deleted product." });
}; */

exports.getProducts = getProducts;
exports.getProductById = getProductById;
exports.createProduct = createProduct;
exports.getProductByCategoryId = getProductByCategoryId;
exports.getProductByShopId = getProductByShopId;

exports.updateProductById = updateProductById;
/* exports.deleteProductById = deleteProductById;  */
