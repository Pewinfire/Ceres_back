const express = require("express");
const { check } = require("express-validator");
const categoryControllers = require("../controllers/category-controllers");

/* const fileUpload = require("../middleware/file-upload"); */

const router = express.Router();

router.get("/", categoryControllers.getCategories);

/* router.get("/:cid", categoryControllers.getCategoryById); */

router.post(
  "/",
  /*  fileUpload.single("image"), */
  [check("name").not().isEmpty()],
  categoryControllers.createCategory
);
router.patch(
  "/:cid",
/*   fileUpload.single("image"), */
  [check("name").not().isEmpty()],
  categoryControllers.updateCategoryById
);

router.delete("/:cid", categoryControllers.deleteCategoryById);

module.exports = router;
