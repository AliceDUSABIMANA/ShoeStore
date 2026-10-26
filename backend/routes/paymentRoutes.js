 // =====================================================
// SHOE STORE - PAYMENT ROUTES
// =====================================================

const express = require("express");

const router = express.Router();

const {
    getAllPayments,
    getPaymentsByCustomer,
    createPayment,
    getPaymentById
} = require("../controllers/paymentController");

// =====================================================
// GET ALL PAYMENTS
// =====================================================

router.get("/", getAllPayments);

// =====================================================
// GET CUSTOMER PAYMENTS
// =====================================================

router.get("/customer/:customerId", getPaymentsByCustomer);

// =====================================================
// CREATE PAYMENT
// =====================================================

router.post("/", createPayment);

// =====================================================
// GET PAYMENT BY ID
// =====================================================

router.get("/:id", getPaymentById);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;