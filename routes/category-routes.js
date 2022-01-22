const express = require("express");
const { check } = require("express-validator");
const categoryControllers = require("../controllers/category-controllers");

/* const fileUpload = require("../middleware/file-upload"); */

const router = express.Router();

router.get("/", categoryControllers.getCategories);

/* router.get("/:cid", categoryControllers.getCategoryById); */
/* 
router.patch(
  "/:mid",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("postalCode").isLength(5),
    check("address").not().isEmpty(),
  ],
  marketControllers.updateMarketById
); */

router.post(
  "/",
  /*  fileUpload.single("image"), */
  [check("name").not().isEmpty()],
  categoryControllers.createCategory
);

module.exports = router;
