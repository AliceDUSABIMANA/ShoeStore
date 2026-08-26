const db = require("../config/database");

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const [users] = await db.query(
            `SELECT
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
             LIMIT 1`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        if (password !== user.password) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        delete user.password;

        return res.json({
            success: true,
            message: "Login successful.",
            user: user
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during login.",
            error: error.message
        });
    }
}

module.exports = {
    login
};