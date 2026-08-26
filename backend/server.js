 const express = require("express");
const cors = require("cors");
 const db = require("./config/database");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

const PORT = 5000;

// ===============================
// Middleware
// ===============================

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);


// ===============================
// Test Server
// ===============================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "ShoeStore backend is running!"
    });
});


// ===============================
// Test Database
// ===============================

app.get("/api/test-db", async (req, res) => {

    try {

        const [rows] = await db.query(
            "SELECT 1 AS test"
        );

        res.json({
            success: true,
            message: "ShoeStore database connected successfully!",
            result: rows
        });

    } catch (error) {

        console.error("Database error:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed.",
            error: error.message
        });
    }
});


// ===============================
// PRODUCT ROUTES
// ===============================

app.use("/api/products", productRoutes);


// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {

    console.log(
        `ShoeStore server running at http://localhost:${PORT}`
    );

});