// =====================================================
// SHOE STORE - USER ROUTES
// =====================================================

const express = require("express");

const router = express.Router();

const {
    getAllCustomers,
    getAllDeliverymen,
    getUserById,
    createDeliveryman,
    updateDeliveryman,
    deleteDeliveryman
} = require("../controllers/userController");

// =====================================================
// CUSTOMER ROUTES
// =====================================================

router.get("/customers", getAllCustomers);

// =====================================================
// DELIVERYMAN ROUTES
// =====================================================

router.get("/deliverymen", getAllDeliverymen);

router.post("/deliverymen", createDeliveryman);

router.put("/deliverymen/:id", updateDeliveryman);

router.delete("/deliverymen/:id", deleteDeliveryman);

// =====================================================
// USER BY ID
// =====================================================

router.get("/:id", getUserById);

module.exports = router;