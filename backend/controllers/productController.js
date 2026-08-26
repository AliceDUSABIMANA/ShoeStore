const db = require("../config/database");

const getAllProducts = async (req, res) => {
    try {
        const [products] = await db.query(
            "SELECT * FROM products ORDER BY id DESC"
        );

        res.json({
            success: true,
            count: products.length,
            products: products
        });

    } catch (error) {
        console.error("Error fetching products:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: error.message
        });
    }
};

const createProduct = async (req, res) => {
    try {
        const {
            name,
            brand,
            category,
            size,
            price,
            quantity,
            image,
            description
        } = req.body;

        const [result] = await db.query(
            `INSERT INTO products
            (name, brand, category, size, price, quantity, image, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                brand,
                category,
                size,
                price,
                quantity,
                image,
                description
            ]
        );

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            productId: result.insertId
        });

    } catch (error) {
        console.error("Error creating product:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create product",
            error: error.message
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            brand,
            category,
            size,
            price,
            quantity,
            image,
            description
        } = req.body;

        const [result] = await db.query(
            `UPDATE products
             SET name = ?,
                 brand = ?,
                 category = ?,
                 size = ?,
                 price = ?,
                 quantity = ?,
                 image = ?,
                 description = ?
             WHERE id = ?`,
            [
                name,
                brand,
                category,
                size,
                price,
                quantity,
                image,
                description,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            message: "Product updated successfully"
        });

    } catch (error) {
        console.error("Error updating product:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update product",
            error: error.message
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM products WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting product:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete product",
            error: error.message
        });
    }
};

module.exports = {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct
};