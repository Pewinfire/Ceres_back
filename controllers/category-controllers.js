const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const Category = require("../models/category");

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
    categories: categories.map((category) => category.toObject({ getters: true })),
  });
};
/* 
const getCategoryById = async (req, res, next) => {
  const categoryId = req.params.cid;
  let category;
  try {
    category = await Category.findById(categoryId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a category",
      500
    );
    return next(error);
  }

  if (!category) {
    const error = new HttpError(
      "Could not find a category for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ category: category.toObject({ getters: true }) });
};
 */
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
    name
  });

  try {
    await createdCategory.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(201).json({ market: createdCategory.toObject({ getters: true }) });

};

 

  
exports.getCategories = getCategories;
exports.createCategory = createCategory;
/* exports.getCategoryById = getCategoryById; */
