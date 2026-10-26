  // =====================================================
// SHOE STORE - PAYMENT CONTROLLER
// =====================================================

const db = require("../config/database");

// =====================================================
// CREATE PAYMENT
// =====================================================

const createPayment = async (req, res) => {
    try {
        const {
            order_id,
            customer_id,
            amount,
            payment_method,
            transaction_reference,
            mobile_money_phone
        } = req.body;

        if (
            !order_id ||
            !customer_id ||
            !amount ||
            !payment_method
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Order ID, customer ID, amount and payment method are required."
            });
        }

        const allowedMethods = [
            "mobile_money",
            "cash"
        ];

        if (!allowedMethods.includes(payment_method)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment method. Use mobile_money or cash."
            });
        }

        if (
            payment_method === "mobile_money" &&
            !mobile_money_phone
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Mobile Money phone number is required."
            });
        }

        const [orders] = await db.query(
            `
            SELECT
                id,
                customer_id,
                total_amount,
                order_status
            FROM orders
            WHERE id = ?
            `,
            [order_id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        const order = orders[0];

        if (
            Number(order.customer_id) !==
            Number(customer_id)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "This order does not belong to this customer."
            });
        }

        const orderAmount =
            Number(order.total_amount);

        const paymentAmount =
            Number(amount);

        if (
            Number.isNaN(paymentAmount) ||
            paymentAmount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment amount."
            });
        }

        if (
            Math.abs(
                paymentAmount - orderAmount
            ) > 0.01
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Payment amount must be ${orderAmount} RWF.`
            });
        }

        const [existingPaidPayments] =
            await db.query(
                `
                SELECT id
                FROM payments
                WHERE order_id = ?
                AND payment_status = 'paid'
                LIMIT 1
                `,
                [order_id]
            );

        if (existingPaidPayments.length > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "This order has already been paid."
            });
        }

        let reference =
            transaction_reference;

        if (!reference) {
            if (
                payment_method ===
                "mobile_money"
            ) {
                reference =
                    "MM-" + Date.now();
            } else {
                reference =
                    "CASH-" + Date.now();
            }
        }

        const paymentStatus =
            "pending";

        const [result] =
            await db.query(
                `
                INSERT INTO payments
                (
                    order_id,
                    customer_id,
                    amount,
                    payment_method,
                    payment_status,
                    transaction_reference
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    order_id,
                    customer_id,
                    paymentAmount,
                    payment_method,
                    paymentStatus,
                    reference
                ]
            );

        if (
            payment_method ===
            "mobile_money"
        ) {
            return res.status(201).json({
                success: true,
                message:
                    "Mobile Money payment request has been recorded and is pending confirmation.",
                payment: {
                    id: result.insertId,
                    order_id,
                    customer_id,
                    amount: paymentAmount,
                    payment_method,
                    payment_status:
                        paymentStatus,
                    transaction_reference:
                        reference,
                    mobile_money_phone
                }
            });
        }

        return res.status(201).json({
            success: true,
            message:
                "Cash payment has been recorded successfully.",
            payment: {
                id: result.insertId,
                order_id,
                customer_id,
                amount: paymentAmount,
                payment_method,
                payment_status:
                    paymentStatus,
                transaction_reference:
                    reference
            }
        });

    } catch (error) {
        console.error(
            "Create payment error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create payment.",
            error: error.message
        });
    }
};

// =====================================================
// GET ALL PAYMENTS
// =====================================================

const getAllPayments = async (req, res) => {
    try {
        const [payments] =
            await db.query(
                `
                SELECT
                    p.id,
                    p.order_id,
                    p.customer_id,
                    p.amount,
                    p.payment_method,
                    p.payment_status,
                    p.transaction_reference,
                    p.created_at,

                    u.first_name,
                    u.last_name,
                    u.email

                FROM payments p

                LEFT JOIN users u
                    ON p.customer_id = u.id

                ORDER BY p.id DESC
                `
            );

        return res.json({
            success: true,
            payments
        });

    } catch (error) {
        console.error(
            "Get payments error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load payments.",
            error: error.message
        });
    }
};

// =====================================================
// GET PAYMENT BY ID
// =====================================================

const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Payment ID is required."
            });
        }

        const [payments] =
            await db.query(
                `
                SELECT
                    p.id,
                    p.order_id,
                    p.customer_id,
                    p.amount,
                    p.payment_method,
                    p.payment_status,
                    p.transaction_reference,
                    p.created_at,

                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone

                FROM payments p

                LEFT JOIN users u
                    ON p.customer_id = u.id

                WHERE p.id = ?

                LIMIT 1
                `,
                [id]
            );

        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Payment not found."
            });
        }

        return res.json({
            success: true,
            payment: payments[0]
        });

    } catch (error) {
        console.error(
            "Get payment by ID error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load payment.",
            error: error.message
        });
    }
};

// =====================================================
// GET PAYMENTS BY CUSTOMER
// =====================================================

const getPaymentsByCustomer = async (
    req,
    res
) => {
    try {
        const { customerId } =
            req.params;

        const [payments] =
            await db.query(
                `
                SELECT
                    id,
                    order_id,
                    customer_id,
                    amount,
                    payment_method,
                    payment_status,
                    transaction_reference,
                    created_at

                FROM payments

                WHERE customer_id = ?

                ORDER BY id DESC
                `,
                [customerId]
            );

        return res.json({
            success: true,
            payments
        });

    } catch (error) {
        console.error(
            "Get customer payments error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load customer payments.",
            error: error.message
        });
    }
};

// =====================================================
// UPDATE PAYMENT STATUS
// =====================================================

const updatePaymentStatus = async (
    req,
    res
) => {
    try {
        const { paymentId } =
            req.params;

        const { payment_status } =
            req.body;

        const allowedStatuses = [
            "pending",
            "paid",
            "failed",
            "cancelled"
        ];

        if (
            !allowedStatuses.includes(
                payment_status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment status."
            });
        }

        const [payments] =
            await db.query(
                `
                SELECT
                    id,
                    order_id,
                    payment_method,
                    payment_status

                FROM payments

                WHERE id = ?
                `,
                [paymentId]
            );

        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Payment not found."
            });
        }

        await db.query(
            `
            UPDATE payments
            SET payment_status = ?
            WHERE id = ?
            `,
            [
                payment_status,
                paymentId
            ]
        );

        if (
            payment_status === "paid"
        ) {
            await db.query(
                `
                UPDATE orders
                SET order_status = 'confirmed'
                WHERE id = ?
                AND order_status = 'pending'
                `,
                [payments[0].order_id]
            );
        }

        return res.json({
            success: true,
            message:
                "Payment status updated successfully."
        });

    } catch (error) {
        console.error(
            "Update payment status error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update payment status.",
            error: error.message
        });
    }
};

// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {
    createPayment,
    getAllPayments,
    getPaymentById,
    getPaymentsByCustomer,
    updatePaymentStatus
};