  // =====================================================
// SHOE STORE - DELIVERY ROUTES
// =====================================================

const express = require("express");

const router = express.Router();

const {
    getAllDeliveries,
    getDeliveriesByDeliveryman,
    getDeliveriesByCustomer,
    updateDeliveryStatus,
    saveDeliveryLocation,
    getLatestDeliveryLocation,
    assignDeliveryman,
    assignDeliverymanByOrder
} = require("../controllers/deliveryController");


// =====================================================
// GET ALL DELIVERIES
// GET /api/deliveries
// =====================================================

router.get(
    "/",
    getAllDeliveries
);


// =====================================================
// GET DELIVERIES FOR CUSTOMER
// GET /api/deliveries/customer/:customerId
// =====================================================

router.get(
    "/customer/:customerId",
    getDeliveriesByCustomer
);


// =====================================================
// GET DELIVERIES FOR DELIVERYMAN
// GET /api/deliveries/deliveryman/:deliverymanId
// =====================================================

router.get(
    "/deliveryman/:deliverymanId",
    getDeliveriesByDeliveryman
);


// =====================================================
// UPDATE DELIVERY STATUS
// PUT /api/deliveries/:deliveryId/status
// =====================================================

router.put(
    "/:deliveryId/status",
    updateDeliveryStatus
);


// =====================================================
// ASSIGN DELIVERYMAN BY ORDER ID
// PUT /api/deliveries/order/:orderId/assign
// =====================================================

router.put(
    "/order/:orderId/assign",
    assignDeliverymanByOrder
);


// =====================================================
// ASSIGN DELIVERYMAN BY DELIVERY ID
// PUT /api/deliveries/:deliveryId/assign
// =====================================================

router.put(
    "/:deliveryId/assign",
    assignDeliveryman
);


// =====================================================
// SAVE DELIVERYMAN GPS LOCATION
// POST /api/deliveries/:deliveryId/location
// =====================================================

router.post(
    "/:deliveryId/location",
    saveDeliveryLocation
);


// =====================================================
// GET LATEST DELIVERY LOCATION
// GET /api/deliveries/:deliveryId/location
// =====================================================

router.get(
    "/:deliveryId/location",
    getLatestDeliveryLocation
);


// =====================================================
// ROUTER LOADED
// =====================================================

console.log("DELIVERY ROUTES LOADED");


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;