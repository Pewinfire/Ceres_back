const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const Category = require("../models/category");
const Product = require("../models/product");
const checkRol = require("../util/checkRol");
const mongoose = require("mongoose");

const getCategories = async (req, res, next) => {
  let categories;
  try {
    categories = await Category.find({});
  } catch (err) {
    const error = new HttpError(
      "Fetching categories failed, please try again.",
      500
    );
    return next(error);
  }
  res.json({
    categories: categories.map((category) =>
      category.toObject({ getters: true })
    ),
  });
};

const getCategoriesSelect = async (req, res, next) => {
  let categories;
  try {
    categories = await Category.find({}, "-products");
  } catch (err) {
    const error = new HttpError(
      "Fetching categories failed, please try again.",
      500
    );
    return next(error);
  }
  res.json({
    categories: categories.map((category) =>
      category.toObject({ getters: true })
    ),
  });
};

const createCategory = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(" Invalid inputs passed, please check your data", 422)
    );
  }
  const { name } = req.body;

  let existingCategory;
  try {
    existingCategory = await Category.findOne({ name: name });
  } catch (err) {
    const error = new HttpError(
      "Ha ocurrido un error al intentar registrar el mercado, intentalo de nuevo",
      500
    );
    return next(error);
  }

  if (existingCategory) {
    const error = new HttpError("La categoria introducida ya existe", 422);
    return next(error);
  }
  const createdCategory = new Category({
    name,
  });

  try {
    await createdCategory.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res
    .status(201)
    .json({ category: createdCategory.toObject({ getters: true }) });
};
const updateCategoryById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(" Invalid inputs passed, please check your data", 422)
    );
  }

  const { name } = req.body;
  const categoryId = req.params.cid;

  let category;

  try {
    category = await Category.findById(categoryId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update category",
      500
    );
    return next(error);
  }

  category.name = name;

  try {
    await category.save();
  } catch (err) {
    const error = new HttpError(
      "No se ha podido actualizar el Mercado, intentelo de nuevo",
      500
    );
    return next(error);
  }

  res.status(200).json({ category: category.toObject({ getters: true }) });
};

const deleteCategoryById = async (req, res, next) => {
  const categoryId = req.params.cid;
  // comprueba si el usuario que envia la req es admin
  try {
    await checkRol(req.userData.userId, "1231231232");
  } catch (err) {
    const error = new HttpError("Unautorizhed", 401);
    return next(error);
  }
  // busca la categoria segun el id que se le ha pasado por url
  let category;
  try {
    category = await Category.findById(categoryId);
  } catch (err) {
  //error en la busqueda
    const error = new HttpError(
      "Something went wrong, could not delete category.",
      500
    );
    return next(error);
  }
// no se encuentra categoria
  if (!category) {
    const error = new HttpError("Could not find a product for this id", 404); // check si existe el id
    return next(error);
  }
  let product;
  // abre sesion, coge el array de productos de esa categoria y busca en la coleccion (tabla) de productos todos
  //aquellos con esa categoria (otro array), pullea la categoria y guarda el producto. Commitea la sesion
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    for (let prd of category.products) {
      product = await Product.findById(prd);
      product.categories.pull(category);
      await product.save({ session: sess });
    }
    await category.remove({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(200).json({ message: "Deleted category." });
};

exports.deleteCategoryById = deleteCategoryById;
exports.updateCategoryById = updateCategoryById;
exports.getCategories = getCategories;
exports.createCategory = createCategory;
