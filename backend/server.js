 // =====================================================
// SHOE STORE - BACKEND SERVER
// =====================================================

const express = require("express");
const cors = require("cors");
const db = require("./config/database");

// =====================================================
// ROUTES
// =====================================================

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const userRoutes = require("./routes/userRoutes");

// =====================================================
// CREATE APP
// =====================================================

const app = express();

const PORT = 5000;

// =====================================================
// MIDDLEWARE
// =====================================================

// Allow requests from the frontend
app.use(cors());

// Allow JSON request bodies
app.use(express.json());

// =====================================================
// TEST SERVER
// =====================================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "ShoeStore backend is running!"
    });
});

// =====================================================
// AUTH ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

// =====================================================
// PRODUCT ROUTES
// =====================================================

app.use("/api/products", productRoutes);

// =====================================================
// ORDER ROUTES
// =====================================================

app.use("/api/orders", orderRoutes);

// =====================================================
// PAYMENT ROUTES
// =====================================================

app.use("/api/payments", paymentRoutes);

// =====================================================
// DELIVERY ROUTES
// =====================================================

app.use("/api/deliveries", deliveryRoutes);

// =====================================================
// USER ROUTES
// =====================================================

app.use("/api/users", userRoutes);

// =====================================================
// TEST API
// =====================================================

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "ShoeStore API is working."
    });
});

// =====================================================
// TEST DATABASE
// =====================================================

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

        console.error(
            "Database error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Database connection failed.",
            error: error.message
        });

    }

});

// =====================================================
// API 404
// =====================================================

app.use("/api", (req, res) => {

    res.status(404).json({
        success: false,
        message: "API endpoint not found.",
        path: req.originalUrl
    });

});

// =====================================================
// SERVER ERROR HANDLER
// =====================================================

app.use((error, req, res, next) => {

    console.error(
        "Server error:",
        error
    );

    res.status(500).json({
        success: false,
        message: "Internal server error.",
        error: error.message
    });

});

// =====================================================
// START SERVER
// =====================================================

app.listen(
    PORT,
    "127.0.0.1",
    () => {

        console.log(
            "=========================================="
        );

        console.log(
            "       SHOE STORE BACKEND SERVER"
        );

        console.log(
            "=========================================="
        );

        console.log(
            `Server: http://127.0.0.1:${PORT}`
        );

        console.log(
            `API Test: http://127.0.0.1:${PORT}/api/test`
        );

        console.log(
            `Database Test: http://127.0.0.1:${PORT}/api/test-db`
        );

        console.log(
            `Login: POST http://127.0.0.1:${PORT}/api/auth/login`
        );

        console.log(
            `Products: http://127.0.0.1:${PORT}/api/products`
        );

        console.log(
            `Orders: http://127.0.0.1:${PORT}/api/orders`
        );

        console.log(
            `Payments: http://127.0.0.1:${PORT}/api/payments`
        );

        console.log(
            `Deliveries: http://127.0.0.1:${PORT}/api/deliveries`
        );

        console.log(
            `Users: http://127.0.0.1:${PORT}/api/users`
        );

        console.log(
            "=========================================="
        );

    }
);