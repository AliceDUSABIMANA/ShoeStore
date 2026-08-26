const express = require("express");

const router = express.Router();

const {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");

// Get all products
router.get("/", getAllProducts);

// Add a new product
router.post("/", createProduct);

// Update a product
router.put("/:id", updateProduct);

// Delete a product
router.delete("/:id", deleteProduct);

module.exports = router;