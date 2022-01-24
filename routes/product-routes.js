const express = require("express");

const { check } = require("express-validator");

const productControllers = require("../controllers/product-controllers");

const router = express.Router();

/* const fileUpload = require("../middleware/file-upload"); */

router.get("/", productControllers.getProducts);

router.get("/:pid", productControllers.getProductById);

router.get("/shop/:shid", productControllers.getProductByShopId);

router.get("/category/:cid", productControllers.getProductByCategoryId);

router.post(
  "/",
  /* fileUpload.single("image"), */
  [check("name").not().isEmpty()],
  productControllers.createProduct
);

router.patch(
  "/:pid",
  /* fileUpload.single("image"), */
  [check("name").not().isEmpty()], // solo la imagen
  productControllers.updateProductById
);

router.delete("/:pid", productControllers.deleteProductById); 

module.exports = router;
