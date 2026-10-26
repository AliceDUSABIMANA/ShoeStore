// =====================================================
// SHOE STORE - USER CONTROLLER
// =====================================================

const db = require("../config/database");

// =====================================================
// GET ALL CUSTOMERS
// GET /api/users/customers
// =====================================================

const getAllCustomers = async (req, res) => {
    try {
        const [customers] = await db.query(`
            SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.role,
                u.created_at,
                COUNT(o.id) AS order_count
            FROM users u
            LEFT JOIN orders o
                ON u.id = o.customer_id
            WHERE u.role = 'customer'
            GROUP BY
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.role,
                u.created_at
            ORDER BY u.created_at DESC
        `);

        res.json({
            success: true,
            count: customers.length,
            customers
        });

    } catch (error) {
        console.error("Get customers error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load customers.",
            error: error.message
        });
    }
};

// =====================================================
// GET ALL DELIVERYMEN
// GET /api/users/deliverymen
// =====================================================

const getAllDeliverymen = async (req, res) => {
    try {
        const [deliverymen] = await db.query(`
            SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.role,
                u.created_at,
                COUNT(d.id) AS delivery_count
            FROM users u
            LEFT JOIN deliveries d
                ON u.id = d.deliveryman_id
            WHERE u.role = 'deliveryman'
            GROUP BY
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.role,
                u.created_at
            ORDER BY u.created_at DESC
        `);

        res.json({
            success: true,
            count: deliverymen.length,
            deliverymen
        });

    } catch (error) {
        console.error("Get deliverymen error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load deliverymen.",
            error: error.message
        });
    }
};

// =====================================================
// GET USER BY ID
// GET /api/users/:id
// =====================================================

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await db.query(
            `
            SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                role,
                created_at
            FROM users
            WHERE id = ?
            `,
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error("Get user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load user.",
            error: error.message
        });
    }
};

// =====================================================
// CREATE DELIVERYMAN
// POST /api/users/deliverymen
// =====================================================

const createDeliveryman = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            password,
            phone
        } = req.body;

        if (!first_name || !last_name || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: "First name, last name, email, password and phone are required."
            });
        }

        // Check if email already exists
        const [existingUser] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A user with this email already exists."
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO users
                (first_name, last_name, email, password, phone, role)
            VALUES
                (?, ?, ?, ?, ?, 'deliveryman')
            `,
            [
                first_name,
                last_name,
                email,
                password,
                phone
            ]
        );

        res.status(201).json({
            success: true,
            message: "Deliveryman created successfully.",
            deliverymanId: result.insertId
        });

    } catch (error) {
        console.error("Create deliveryman error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create deliveryman.",
            error: error.message
        });
    }
};

// =====================================================
// UPDATE DELIVERYMAN
// PUT /api/users/deliverymen/:id
// =====================================================

const updateDeliveryman = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            first_name,
            last_name,
            email,
            password,
            phone
        } = req.body;

        // Check deliveryman exists
        const [existing] = await db.query(
            `
            SELECT id
            FROM users
            WHERE id = ?
            AND role = 'deliveryman'
            `,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Deliveryman not found."
            });
        }

        if (!first_name || !last_name || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: "First name, last name, email and phone are required."
            });
        }

        // Check email is not being used by another user
        const [emailCheck] = await db.query(
            `
            SELECT id
            FROM users
            WHERE email = ?
            AND id != ?
            `,
            [email, id]
        );

        if (emailCheck.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This email is already being used."
            });
        }

        if (password && password.trim() !== "") {

            await db.query(
                `
                UPDATE users
                SET
                    first_name = ?,
                    last_name = ?,
                    email = ?,
                    password = ?,
                    phone = ?
                WHERE id = ?
                AND role = 'deliveryman'
                `,
                [
                    first_name,
                    last_name,
                    email,
                    password,
                    phone,
                    id
                ]
            );

        } else {

            await db.query(
                `
                UPDATE users
                SET
                    first_name = ?,
                    last_name = ?,
                    email = ?,
                    phone = ?
                WHERE id = ?
                AND role = 'deliveryman'
                `,
                [
                    first_name,
                    last_name,
                    email,
                    phone,
                    id
                ]
            );
        }

        res.json({
            success: true,
            message: "Deliveryman updated successfully."
        });

    } catch (error) {
        console.error("Update deliveryman error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update deliveryman.",
            error: error.message
        });
    }
};

// =====================================================
// DELETE DELIVERYMAN
// DELETE /api/users/deliverymen/:id
// =====================================================

const deleteDeliveryman = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query(
            `
            SELECT id
            FROM users
            WHERE id = ?
            AND role = 'deliveryman'
            `,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Deliveryman not found."
            });
        }

        // Do not allow deletion if the deliveryman has deliveries
        const [deliveries] = await db.query(
            `
            SELECT id
            FROM deliveries
            WHERE deliveryman_id = ?
            LIMIT 1
            `,
            [id]
        );

        if (deliveries.length > 0) {
            return res.status(400).json({
                success: false,
                message: "This deliveryman cannot be deleted because they have delivery records."
            });
        }

        await db.query(
            `
            DELETE FROM users
            WHERE id = ?
            AND role = 'deliveryman'
            `,
            [id]
        );

        res.json({
            success: true,
            message: "Deliveryman deleted successfully."
        });

    } catch (error) {
        console.error("Delete deliveryman error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete deliveryman.",
            error: error.message
        });
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getAllCustomers,
    getAllDeliverymen,
    getUserById,
    createDeliveryman,
    updateDeliveryman,
    deleteDeliveryman
};