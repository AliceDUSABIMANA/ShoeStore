const express = require("express");

const router = express.Router();
console.log("ORDER ROUTES LOADED");

const {
    getAllOrders,
    getOrderById,
    getOrdersByCustomer,
    createOrder,
    deleteOrder
} = require("../controllers/orderController");


// ==============================
// ORDER ROUTES
// ==============================

// Get all orders
router.get("/", getAllOrders);

// Get customer orders
router.get("/customer/:customerId", getOrdersByCustomer);

// Get one order
router.get("/:id", getOrderById);

// Create order
router.post("/", createOrder);

// Delete order
router.delete("/:id", deleteOrder);


module.exports = router;