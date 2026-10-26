 // =====================================================
// SHOE STORE - DELIVERY CONTROLLER
// =====================================================

const db = require("../config/database");


// =====================================================
// GET ALL DELIVERIES
// GET /api/deliveries
// =====================================================

const getAllDeliveries = async (req, res) => {

    try {

        const [deliveries] = await db.query(`
            SELECT
                d.id,
                d.order_id,
                d.deliveryman_id,
                d.delivery_status,
                d.started_at,
                d.delivered_at,
                d.created_at,

                o.customer_id,
                o.total_amount,
                o.delivery_address,
                o.delivery_latitude,
                o.delivery_longitude,
                o.order_status,

                CONCAT(
                    c.first_name,
                    ' ',
                    c.last_name
                ) AS customer_name,

                c.email AS customer_email,
                c.phone AS customer_phone,

                CONCAT(
                    dm.first_name,
                    ' ',
                    dm.last_name
                ) AS deliveryman_name,

                dm.email AS deliveryman_email,
                dm.phone AS deliveryman_phone,

                (
                    SELECT dl.latitude
                    FROM delivery_locations dl
                    WHERE dl.delivery_id = d.id
                    ORDER BY dl.created_at DESC
                    LIMIT 1
                ) AS current_latitude,

                (
                    SELECT dl.longitude
                    FROM delivery_locations dl
                    WHERE dl.delivery_id = d.id
                    ORDER BY dl.created_at DESC
                    LIMIT 1
                ) AS current_longitude,

                (
                    SELECT dl.created_at
                    FROM delivery_locations dl
                    WHERE dl.delivery_id = d.id
                    ORDER BY dl.created_at DESC
                    LIMIT 1
                ) AS location_updated_at

            FROM deliveries d

            LEFT JOIN orders o
                ON d.order_id = o.id

            LEFT JOIN users c
                ON o.customer_id = c.id

            LEFT JOIN users dm
                ON d.deliveryman_id = dm.id

            ORDER BY
                d.id DESC
        `);

        res.json({
            success: true,
            count: deliveries.length,
            deliveries: deliveries
        });

    } catch (error) {

        console.error(
            "Get all deliveries error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to load deliveries.",
            error: error.message
        });
    }
};


// =====================================================
// GET DELIVERIES BY DELIVERYMAN
// GET /api/deliveries/deliveryman/:deliverymanId
// =====================================================

const getDeliveriesByDeliveryman = async (req, res) => {

    const deliverymanId =
        Number(req.params.deliverymanId);

    // =================================================
    // VALIDATE DELIVERYMAN ID
    // =================================================

    if (
        !Number.isInteger(deliverymanId) ||
        deliverymanId <= 0
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid deliveryman ID."
        });

    }


    try {

        // =================================================
        // VERIFY THAT USER IS A DELIVERYMAN
        // =================================================

        const [userRows] = await db.query(
            `
            SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                role
            FROM users
            WHERE id = ?
            AND role = 'deliveryman'
            LIMIT 1
            `,
            [deliverymanId]
        );


        if (userRows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Deliveryman account not found."
            });

        }


        // =================================================
        // GET ALL DELIVERIES ASSIGNED TO THIS DELIVERYMAN
        //
        // IMPORTANT:
        // There is intentionally NO LIMIT here.
        //
        // If deliveryman has:
        // Order #27
        // Order #35
        // Order #40
        //
        // all three are returned.
        // =================================================

        const [deliveries] = await db.query(
            `
            SELECT
                d.id,
                d.order_id,
                d.deliveryman_id,
                d.delivery_status,
                d.started_at,
                d.delivered_at,
                d.created_at,

                o.customer_id,
                o.total_amount,
                o.delivery_address,
                o.delivery_latitude,
                o.delivery_longitude,
                o.order_status,

                CONCAT(
                    c.first_name,
                    ' ',
                    c.last_name
                ) AS customer_name,

                c.email AS customer_email,
                c.phone AS customer_phone,

                (
                    SELECT dl.latitude
                    FROM delivery_locations dl
                    WHERE dl.delivery_id = d.id
                    ORDER BY dl.created_at DESC
                    LIMIT 1
                ) AS current_latitude,

                (
                    SELECT dl.longitude
                    FROM delivery_locations dl
                    WHERE dl.delivery_id = d.id
                    ORDER BY dl.created_at DESC
                    LIMIT 1
                ) AS current_longitude,

                (
                    SELECT dl.created_at
                    FROM delivery_locations dl
                    WHERE dl.delivery_id = d.id
                    ORDER BY dl.created_at DESC
                    LIMIT 1
                ) AS location_updated_at

            FROM deliveries d

            LEFT JOIN orders o
                ON d.order_id = o.id

            LEFT JOIN users c
                ON o.customer_id = c.id

            WHERE d.deliveryman_id = ?

            ORDER BY
                d.id DESC
            `,
            [deliverymanId]
        );


        // =================================================
        // LOG EXACTLY WHAT WAS RETURNED
        // =================================================

        console.log(
            `Deliveryman ${deliverymanId} has ${deliveries.length} delivery record(s).`
        );

        console.log(
            "Deliveryman delivery records:",
            deliveries.map(function (delivery) {

                return {
                    delivery_id: delivery.id,
                    order_id: delivery.order_id,
                    deliveryman_id: delivery.deliveryman_id,
                    delivery_status: delivery.delivery_status
                };

            })
        );


        // =================================================
        // RETURN ALL RECORDS
        // =================================================

        return res.json({

            success: true,

            count: deliveries.length,

            deliveryman_id: deliverymanId,

            deliveries: deliveries

        });

    } catch (error) {

        console.error(
            "Get deliveries by deliveryman error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load deliveryman deliveries.",

            error:
                error.message

        });

    }
};


// =====================================================
// GET DELIVERIES BY CUSTOMER
// GET /api/deliveries/customer/:customerId
// =====================================================

const getDeliveriesByCustomer = async (req, res) => {

    const customerId =
        Number(req.params.customerId);

    if (
        !Number.isInteger(customerId) ||
        customerId <= 0
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid customer ID."
        });

    }


    try {

        const [deliveries] = await db.query(`
            SELECT
                d.id,
                d.order_id,
                d.deliveryman_id,
                d.delivery_status,
                d.started_at,
                d.delivered_at,
                d.created_at,

                o.customer_id,
                o.total_amount,
                o.delivery_address,
                o.delivery_latitude,
                o.delivery_longitude,
                o.order_status,

                CONCAT(
                    dm.first_name,
                    ' ',
                    dm.last_name
                ) AS deliveryman_name,

                dm.email AS deliveryman_email,
                dm.phone AS deliveryman_phone,

                (
                    SELECT dl.latitude
                    FROM delivery_locations dl
                    WHERE dl.delivery_id = d.id
                    ORDER BY dl.created_at DESC
                    LIMIT 1
                ) AS current_latitude,

                (
                    SELECT dl.longitude
                    FROM delivery_locations dl
                    WHERE dl.delivery_id = d.id
                    ORDER BY dl.created_at DESC
                    LIMIT 1
                ) AS current_longitude,

                (
                    SELECT dl.created_at
                    FROM delivery_locations dl
                    WHERE dl.delivery_id = d.id
                    ORDER BY dl.created_at DESC
                    LIMIT 1
                ) AS location_updated_at

            FROM deliveries d

            LEFT JOIN orders o
                ON d.order_id = o.id

            LEFT JOIN users dm
                ON d.deliveryman_id = dm.id

            WHERE o.customer_id = ?

            ORDER BY
                d.id DESC
        `, [customerId]);


        res.json({

            success: true,

            count: deliveries.length,

            deliveries: deliveries

        });

    } catch (error) {

        console.error(
            "Get deliveries by customer error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to load customer deliveries.",

            error:
                error.message

        });

    }
};


// =====================================================
// UPDATE DELIVERY STATUS
// PUT /api/deliveries/:deliveryId/status
// =====================================================

const updateDeliveryStatus = async (req, res) => {

    const deliveryId =
        Number(req.params.deliveryId);

    const delivery_status =
        req.body.status ||
        req.body.delivery_status;

    const deliveryman_id =
        req.body.deliveryman_id || null;


    const allowedStatuses = [
        "assigned",
        "started",
        "on_the_way",
        "delivered",
        "cancelled"
    ];


    // =================================================
    // VALIDATE DELIVERY ID
    // =================================================

    if (
        !Number.isInteger(deliveryId) ||
        deliveryId <= 0
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Invalid delivery ID."

        });

    }


    // =================================================
    // VALIDATE STATUS
    // =================================================

    if (!delivery_status) {

        return res.status(400).json({

            success: false,

            message:
                "Delivery status is required."

        });

    }


    if (
        !allowedStatuses.includes(
            delivery_status
        )
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Invalid delivery status."

        });

    }


    let connection;


    try {

        connection =
            await db.getConnection();


        await connection.beginTransaction();


        // =================================================
        // CHECK DELIVERY
        // =================================================

        const [deliveryRows] =
            await connection.query(
                `
                SELECT
                    id,
                    order_id,
                    deliveryman_id,
                    delivery_status
                FROM deliveries
                WHERE id = ?
                LIMIT 1
                `,
                [deliveryId]
            );


        if (
            deliveryRows.length === 0
        ) {

            await connection.rollback();

            return res.status(404).json({

                success: false,

                message:
                    "Delivery not found."

            });

        }


        const delivery =
            deliveryRows[0];


        // =================================================
        // CHECK DELIVERYMAN
        // =================================================

        if (
            deliveryman_id &&
            delivery.deliveryman_id &&
            Number(
                delivery.deliveryman_id
            ) !== Number(
                deliveryman_id
            )
        ) {

            await connection.rollback();

            return res.status(403).json({

                success: false,

                message:
                    "This delivery is assigned to another deliveryman."

            });

        }


        // =================================================
        // PREVENT CHANGING COMPLETED DELIVERY
        // =================================================

        if (
            delivery.delivery_status ===
                "delivered" &&
            delivery_status !==
                "delivered"
        ) {

            await connection.rollback();

            return res.status(400).json({

                success: false,

                message:
                    "This delivery has already been completed."

            });

        }


        // =================================================
        // UPDATE DELIVERY
        // =================================================

        if (
            delivery_status ===
            "started"
        ) {

            await connection.query(
                `
                UPDATE deliveries
                SET
                    delivery_status = ?,
                    started_at =
                        COALESCE(
                            started_at,
                            NOW()
                        )
                WHERE id = ?
                `,
                [
                    delivery_status,
                    deliveryId
                ]
            );

        }

        else if (
            delivery_status ===
            "delivered"
        ) {

            await connection.query(
                `
                UPDATE deliveries
                SET
                    delivery_status = ?,
                    delivered_at = NOW()
                WHERE id = ?
                `,
                [
                    delivery_status,
                    deliveryId
                ]
            );

        }

        else {

            await connection.query(
                `
                UPDATE deliveries
                SET
                    delivery_status = ?
                WHERE id = ?
                `,
                [
                    delivery_status,
                    deliveryId
                ]
            );

        }


        // =================================================
        // DETERMINE ORDER STATUS
        // =================================================

        let orderStatus =
            delivery_status;


        if (
            delivery_status ===
            "started"
        ) {

            orderStatus =
                "assigned";

        }


        if (
            delivery_status ===
            "on_the_way"
        ) {

            orderStatus =
                "on_the_way";

        }


        if (
            delivery_status ===
            "delivered"
        ) {

            orderStatus =
                "delivered";

        }


        if (
            delivery_status ===
            "cancelled"
        ) {

            orderStatus =
                "cancelled";

        }


        if (
            delivery_status ===
            "assigned"
        ) {

            orderStatus =
                "assigned";

        }


        // =================================================
        // UPDATE ORDER STATUS
        // =================================================

        await connection.query(
            `
            UPDATE orders
            SET
                order_status = ?
            WHERE id = ?
            `,
            [
                orderStatus,
                delivery.order_id
            ]
        );


        // =================================================
        // MARK CASH PAYMENT AS PAID
        // WHEN SUCCESSFULLY DELIVERED
        // =================================================

        if (
            delivery_status ===
            "delivered"
        ) {

            await connection.query(
                `
                UPDATE payments
                SET
                    payment_status = 'paid'
                WHERE order_id = ?
                AND payment_method = 'cash'
                AND payment_status = 'pending'
                `,
                [
                    delivery.order_id
                ]
            );

        }


        // =================================================
        // COMMIT
        // =================================================

        await connection.commit();


        // =================================================
        // RESPONSE
        // =================================================

        return res.json({

            success: true,

            message:
                "Delivery status updated successfully.",

            delivery: {

                id:
                    delivery.id,

                order_id:
                    delivery.order_id,

                deliveryman_id:
                    delivery.deliveryman_id,

                delivery_status:
                    delivery_status

            }

        });

    } catch (error) {

        if (connection) {

            await connection.rollback();

        }


        console.error(
            "Update delivery status error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to update delivery status."

        });

    } finally {

        if (connection) {

            connection.release();

        }

    }

};


// =====================================================
// ASSIGN DELIVERYMAN BY DELIVERY ID
// PUT /api/deliveries/:deliveryId/assign
// =====================================================

const assignDeliveryman = async (req, res) => {

    const deliveryId =
        Number(req.params.deliveryId);

    const {
        deliveryman_id
    } = req.body;


    if (
        !Number.isInteger(deliveryId) ||
        deliveryId <= 0
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Invalid delivery ID."

        });

    }


    if (!deliveryman_id) {

        return res.status(400).json({

            success: false,

            message:
                "Deliveryman ID is required."

        });

    }


    try {

        // =================================================
        // CHECK DELIVERYMAN
        // =================================================

        const [deliverymanRows] =
            await db.query(
                `
                SELECT
                    id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    role
                FROM users
                WHERE id = ?
                AND role = 'deliveryman'
                LIMIT 1
                `,
                [deliveryman_id]
            );


        if (
            deliverymanRows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Deliveryman not found."

            });

        }


        // =================================================
        // CHECK DELIVERY
        // =================================================

        const [deliveryRows] =
            await db.query(
                `
                SELECT
                    id,
                    order_id,
                    delivery_status
                FROM deliveries
                WHERE id = ?
                LIMIT 1
                `,
                [deliveryId]
            );


        if (
            deliveryRows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Delivery not found."

            });

        }


        const delivery =
            deliveryRows[0];


        if (
            delivery.delivery_status ===
                "delivered" ||
            delivery.delivery_status ===
                "cancelled"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This delivery is already completed or cancelled."

            });

        }


        // =================================================
        // ASSIGN DELIVERYMAN
        // =================================================

        await db.query(
            `
            UPDATE deliveries
            SET
                deliveryman_id = ?,
                delivery_status = 'assigned'
            WHERE id = ?
            `,
            [
                deliveryman_id,
                deliveryId
            ]
        );


        // =================================================
        // UPDATE ORDER
        // =================================================

        await db.query(
            `
            UPDATE orders
            SET
                order_status = 'assigned'
            WHERE id = ?
            `,
            [delivery.order_id]
        );


        return res.json({

            success: true,

            message:
                "Deliveryman assigned successfully.",

            delivery: {

                id:
                    deliveryId,

                order_id:
                    delivery.order_id,

                deliveryman_id:
                    Number(deliveryman_id),

                delivery_status:
                    "assigned"

            }

        });

    } catch (error) {

        console.error(
            "Assign deliveryman error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to assign deliveryman."

        });

    }

};


// =====================================================
// ASSIGN DELIVERYMAN BY ORDER ID
// PUT /api/deliveries/order/:orderId/assign
// =====================================================

const assignDeliverymanByOrder = async (req, res) => {

    const orderId =
        Number(req.params.orderId);

    const {
        deliveryman_id
    } = req.body;


    if (
        !Number.isInteger(orderId) ||
        orderId <= 0
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Invalid order ID."

        });

    }


    if (!deliveryman_id) {

        return res.status(400).json({

            success: false,

            message:
                "Deliveryman ID is required."

        });

    }


    let connection;


    try {

        connection =
            await db.getConnection();


        await connection.beginTransaction();


        // =================================================
        // CHECK ORDER
        // =================================================

        const [orderRows] =
            await connection.query(
                `
                SELECT
                    id,
                    order_status
                FROM orders
                WHERE id = ?
                LIMIT 1
                `,
                [orderId]
            );


        if (
            orderRows.length === 0
        ) {

            await connection.rollback();

            return res.status(404).json({

                success: false,

                message:
                    "Order not found."

            });

        }


        // =================================================
        // CHECK DELIVERYMAN
        // =================================================

        const [deliverymanRows] =
            await connection.query(
                `
                SELECT
                    id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    role
                FROM users
                WHERE id = ?
                AND role = 'deliveryman'
                LIMIT 1
                `,
                [deliveryman_id]
            );


        if (
            deliverymanRows.length === 0
        ) {

            await connection.rollback();

            return res.status(404).json({

                success: false,

                message:
                    "Deliveryman not found."

            });

        }


        // =================================================
        // FIND EXISTING DELIVERY
        // =================================================

        const [deliveryRows] =
            await connection.query(
                `
                SELECT
                    id,
                    order_id,
                    deliveryman_id,
                    delivery_status
                FROM deliveries
                WHERE order_id = ?
                ORDER BY
                    CASE
                        WHEN delivery_status IN
                            (
                                'assigned',
                                'started',
                                'on_the_way'
                            )
                        THEN 0
                        ELSE 1
                    END,
                    id DESC
                LIMIT 1
                FOR UPDATE
                `,
                [orderId]
            );


        let deliveryId;


        // =================================================
        // CREATE DELIVERY IF NONE EXISTS
        // =================================================

        if (
            deliveryRows.length === 0
        ) {

            const [insertResult] =
                await connection.query(
                    `
                    INSERT INTO deliveries
                    (
                        order_id,
                        deliveryman_id,
                        delivery_status
                    )
                    VALUES (?, ?, 'assigned')
                    `,
                    [
                        orderId,
                        deliveryman_id
                    ]
                );


            deliveryId =
                insertResult.insertId;

        }

        else {

            const delivery =
                deliveryRows[0];


            // =================================================
            // DO NOT MODIFY COMPLETED/CANCELLED DELIVERY
            // =================================================

            if (
                delivery.delivery_status ===
                    "delivered" ||
                delivery.delivery_status ===
                    "cancelled"
            ) {

                await connection.rollback();

                return res.status(400).json({

                    success: false,

                    message:
                        "This order already has a completed or cancelled delivery."

                });

            }


            deliveryId =
                delivery.id;


            // =================================================
            // UPDATE DELIVERY ASSIGNMENT
            // =================================================

            await connection.query(
                `
                UPDATE deliveries
                SET
                    deliveryman_id = ?,
                    delivery_status = 'assigned'
                WHERE id = ?
                `,
                [
                    deliveryman_id,
                    deliveryId
                ]
            );

        }


        // =================================================
        // UPDATE ORDER
        // =================================================

        await connection.query(
            `
            UPDATE orders
            SET
                order_status = 'assigned'
            WHERE id = ?
            `,
            [orderId]
        );


        await connection.commit();


        console.log(
            `Order #${orderId} assigned to deliveryman #${deliveryman_id}. Delivery ID: ${deliveryId}`
        );


        return res.json({

            success: true,

            message:
                "Deliveryman assigned successfully.",

            delivery: {

                id:
                    Number(deliveryId),

                order_id:
                    Number(orderId),

                deliveryman_id:
                    Number(deliveryman_id),

                delivery_status:
                    "assigned"

            }

        });

    } catch (error) {

        if (connection) {

            await connection.rollback();

        }


        console.error(
            "Assign deliveryman by order error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to assign deliveryman."

        });

    } finally {

        if (connection) {

            connection.release();

        }

    }

};


// =====================================================
// SAVE DELIVERY LOCATION
// POST /api/deliveries/:deliveryId/location
// =====================================================

const saveDeliveryLocation = async (req, res) => {

    const deliveryId =
        Number(req.params.deliveryId);

    const {
        deliveryman_id,
        latitude,
        longitude
    } = req.body;


    if (
        !Number.isInteger(deliveryId) ||
        deliveryId <= 0
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Invalid delivery ID."

        });

    }


    if (
        !deliveryman_id ||
        latitude === undefined ||
        longitude === undefined
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Deliveryman ID, latitude and longitude are required."

        });

    }


    try {

        // =================================================
        // CHECK DELIVERY
        // =================================================

        const [deliveryRows] =
            await db.query(
                `
                SELECT
                    id,
                    order_id,
                    deliveryman_id,
                    delivery_status
                FROM deliveries
                WHERE id = ?
                LIMIT 1
                `,
                [deliveryId]
            );


        if (
            deliveryRows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Delivery not found."

            });

        }


        const delivery =
            deliveryRows[0];


        // =================================================
        // CHECK DELIVERYMAN
        // =================================================

        if (
            delivery.deliveryman_id &&
            Number(
                delivery.deliveryman_id
            ) !== Number(
                deliveryman_id
            )
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This delivery is assigned to another deliveryman."

            });

        }


        // =================================================
        // SAVE LOCATION
        // =================================================

        const [result] =
            await db.query(
                `
                INSERT INTO delivery_locations
                (
                    delivery_id,
                    deliveryman_id,
                    latitude,
                    longitude
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    deliveryId,
                    deliveryman_id,
                    latitude,
                    longitude
                ]
            );


        return res.json({

            success: true,

            message:
                "Delivery location saved successfully.",

            location: {

                id:
                    result.insertId,

                delivery_id:
                    Number(deliveryId),

                deliveryman_id:
                    Number(deliveryman_id),

                latitude:
                    Number(latitude),

                longitude:
                    Number(longitude)

            }

        });

    } catch (error) {

        console.error(
            "Save delivery location error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to save delivery location."

        });

    }

};


// =====================================================
// GET LATEST DELIVERY LOCATION
// GET /api/deliveries/:deliveryId/location
// =====================================================

const getLatestDeliveryLocation = async (req, res) => {

    const deliveryId =
        Number(req.params.deliveryId);


    if (
        !Number.isInteger(deliveryId) ||
        deliveryId <= 0
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Invalid delivery ID."

        });

    }


    try {

        const [locations] =
            await db.query(
                `
                SELECT
                    dl.id,
                    dl.delivery_id,
                    dl.deliveryman_id,
                    dl.latitude,
                    dl.longitude,
                    dl.created_at
                FROM delivery_locations dl
                WHERE dl.delivery_id = ?
                ORDER BY
                    dl.created_at DESC
                LIMIT 1
                `,
                [deliveryId]
            );


        if (
            locations.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "No delivery location found."

            });

        }


        return res.json({

            success: true,

            location:
                locations[0]

        });

    } catch (error) {

        console.error(
            "Get latest delivery location error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to get latest delivery location."

        });

    }

};


// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {

    getAllDeliveries,

    getDeliveriesByDeliveryman,

    getDeliveriesByCustomer,

    updateDeliveryStatus,

    saveDeliveryLocation,

    getLatestDeliveryLocation,

    assignDeliveryman,

    assignDeliverymanByOrder

};