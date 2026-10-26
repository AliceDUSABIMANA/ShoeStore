 const bcrypt = require("bcrypt");
const db = require("../config/database");

async function login(req, res) {

    try {

        const { email, password } = req.body;

        // =========================================
        // VALIDATION
        // =========================================

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // =========================================
        // FIND USER
        // =========================================

        const [users] = await db.query(
            `
            SELECT
                id,
                first_name,
                last_name,
                email,
                password,
                phone,
                role,
                created_at
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email]
        );

        if (users.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        // =========================================
        // CHECK PASSWORD
        // =========================================

        let passwordIsValid = false;

        // Check bcrypt password
        if (
            typeof user.password === "string" &&
            user.password.startsWith("$2")
        ) {

            passwordIsValid = await bcrypt.compare(
                password,
                user.password
            );

        } else {

            // Temporary support for existing plain-text
            // passwords in the database.
            passwordIsValid =
                password === user.password;
        }

        if (!passwordIsValid) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // =========================================
        // REMOVE PASSWORD
        // =========================================

        delete user.password;

        // =========================================
        // SUCCESS
        // =========================================

        return res.json({

            success: true,

            message: "Login successful.",

            user: user

        });

    } catch (error) {

        console.error("Login error:", error);

        return res.status(500).json({

            success: false,

            message: "Server error during login."

        });
    }
}

module.exports = {
    login
};