 // =====================================================
// SHOE STORE - ORDER CONTROLLER
// =====================================================

const db = require("../config/database");

// =====================================================
// GET ALL ORDERS
// =====================================================

const getAllOrders = async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT
                o.id,
                o.customer_id,
                CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
                u.email AS customer_email,
                u.phone AS customer_phone,
                o.total_amount,
                o.delivery_address,
                o.delivery_latitude,
                o.delivery_longitude,
                o.order_status,

                COALESCE(
                    (
                        SELECT SUM(oi.quantity)
                        FROM order_items oi
                        WHERE oi.order_id = o.id
                    ),
                    0
                ) AS total_items,

                o.created_at

            FROM orders o
            INNER JOIN users u
                ON o.customer_id = u.id

            ORDER BY o.id DESC
        `);

        // TEMPORARY TEST
        console.log("TOTAL ITEMS TEST:", orders[0]);

        res.json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        console.error("Error fetching all orders:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
            error: error.message
        });
    }
};


// =====================================================
// GET SINGLE ORDER BY ID
// =====================================================

const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const [orders] = await db.query(`
            SELECT
                o.id,
                o.customer_id,
                CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
                u.email AS customer_email,
                u.phone AS customer_phone,
                o.total_amount,
                o.delivery_address,
                o.delivery_latitude,
                o.delivery_longitude,
                o.order_status,
                o.created_at
            FROM orders o
            INNER JOIN users u
                ON o.customer_id = u.id
            WHERE o.id = ?
        `, [id]);

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const [items] = await db.query(`
            SELECT
                oi.id,
                oi.product_id,
                p.name AS product_name,
                p.brand,
                p.category,
                oi.quantity,
                oi.price
            FROM order_items oi
            INNER JOIN products p
                ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [id]);

        res.json({
            success: true,
            order: {
                ...orders[0],
                items
            }
        });

    } catch (error) {
        console.error("Error fetching order:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch order",
            error: error.message
        });
    }
};


// =====================================================
// GET ORDERS BY CUSTOMER
// =====================================================

const getOrdersByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;

        const [orders] = await db.query(`
            SELECT
                o.id,
                o.customer_id,
                o.total_amount,
                o.delivery_address,
                o.delivery_latitude,
                o.delivery_longitude,
                o.order_status,
                o.created_at
            FROM orders o
            WHERE o.customer_id = ?
            ORDER BY o.id DESC
        `, [customerId]);

        res.json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        console.error("Error fetching customer orders:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customer orders",
            error: error.message
        });
    }
};


// =====================================================
// CREATE ORDER
// =====================================================

const createOrder = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const {
            customer_id,
            total_amount,
            delivery_address,
            delivery_latitude,
            delivery_longitude,
            items
        } = req.body;

        if (!customer_id) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Customer ID is required"
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Order items are required"
            });
        }

        // Create order
        const [orderResult] = await connection.query(`
            INSERT INTO orders (
                customer_id,
                total_amount,
                delivery_address,
                delivery_latitude,
                delivery_longitude,
                order_status
            )
            VALUES (?, ?, ?, ?, ?, 'pending')
        `, [
            customer_id,
            total_amount,
            delivery_address,
            delivery_latitude,
            delivery_longitude
        ]);

        const orderId = orderResult.insertId;

        // Insert order items
        for (const item of items) {
            await connection.query(`
                INSERT INTO order_items (
                    order_id,
                    product_id,
                    quantity,
                    price
                )
                VALUES (?, ?, ?, ?)
            `, [
                orderId,
                item.product_id,
                item.quantity,
                item.price
            ]);
        }

        // Create delivery record
        await connection.query(`
            INSERT INTO deliveries (
                order_id,
                deliveryman_id,
                delivery_status
            )
            VALUES (?, NULL, 'assigned')
        `, [orderId]);

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order_id: orderId
        });

    } catch (error) {
        await connection.rollback();

        console.error("Error creating order:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create order",
            error: error.message
        });

    } finally {
        connection.release();
    }
};


// =====================================================
// DELETE ORDER
// =====================================================

const deleteOrder = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { id } = req.params;

        await connection.beginTransaction();

        // Delete deliveries
        await connection.query(`
            DELETE FROM deliveries
            WHERE order_id = ?
        `, [id]);

        // Delete order items
        await connection.query(`
            DELETE FROM order_items
            WHERE order_id = ?
        `, [id]);

        // Delete payments
        await connection.query(`
            DELETE FROM payments
            WHERE order_id = ?
        `, [id]);

        // Delete order
        const [result] = await connection.query(`
            DELETE FROM orders
            WHERE id = ?
        `, [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        await connection.commit();

        res.json({
            success: true,
            message: "Order deleted successfully"
        });

    } catch (error) {
        await connection.rollback();

        console.error("Error deleting order:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete order",
            error: error.message
        });

    } finally {
        connection.release();
    }
};


// =====================================================
// EXPORT CONTROLLER FUNCTIONS
// =====================================================

module.exports = {
    getAllOrders,
    getOrderById,
    getOrdersByCustomer,
    createOrder,
    deleteOrder
};