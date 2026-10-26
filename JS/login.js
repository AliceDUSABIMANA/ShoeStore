 // =====================================================
// SHOE STORE LOGIN
// =====================================================

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(message, type) {
    loginMessage.textContent = message;
    loginMessage.className = "login-message " + type;
}

// =====================================================
// LOGIN FORM
// =====================================================

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // =================================================
    // VALIDATION
    // =================================================

    if (!email) {
        showMessage("Please enter your email.", "error");
        return;
    }

    if (!password) {
        showMessage("Please enter your password.", "error");
        return;
    }

    // =================================================
    // DISABLE BUTTON
    // =================================================

    loginButton.disabled = true;

    loginButton.innerHTML =
        '<span>Logging in...</span>' +
        '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {

        // =================================================
        // SEND LOGIN REQUEST
        // =================================================

        const response = await fetch(
            "http://127.0.0.1:5000/api/auth/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );

        // =================================================
        // READ RESPONSE AS TEXT FIRST
        // =================================================
        // This prevents:
        // Unexpected token '<'

        const responseText = await response.text();

        console.log("Login HTTP status:", response.status);
        console.log("Login response:", responseText);

        let data;

        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {

            console.error(
                "Server returned non-JSON:",
                responseText
            );

            throw new Error(
                "The login server returned HTML instead of JSON. " +
                "Please make sure the ShoeStore backend is running on port 5000."
            );
        }

        // =================================================
        // CHECK RESPONSE
        // =================================================

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Invalid email or password."
            );
        }

        // =================================================
        // CHECK USER
        // =================================================

        if (!data.user) {

            throw new Error(
                "Login succeeded but no user information was returned."
            );
        }

        // =================================================
        // SAVE USER
        // =================================================

        localStorage.setItem(
            "shoeStoreUser",
            JSON.stringify(data.user)
        );

        // =================================================
        // SUCCESS
        // =================================================

        showMessage(
            "Login successful! Welcome to ShoeStore.",
            "success"
        );

        loginButton.innerHTML =
            '<span>Login Successful</span>' +
            '<i class="fa-solid fa-check"></i>';

        // =================================================
        // REDIRECT BY ROLE
        // =================================================

        setTimeout(function () {

            if (data.user.role === "admin") {

                window.location.href =
                    "admin-dashboard.html";

            } else if (data.user.role === "customer") {

                window.location.href =
                    "customer-dashboard.html";

            } else if (data.user.role === "deliveryman") {

                window.location.href =
                    "deliveryman-dashboard.html";

            } else {

                showMessage(
                    "Unknown user role: " + data.user.role,
                    "error"
                );

                loginButton.disabled = false;

                loginButton.innerHTML =
                    '<span>Login</span>' +
                    '<i class="fa-solid fa-arrow-right"></i>';
            }

        }, 800);

    } catch (error) {

        console.error("Login error:", error);

        showMessage(
            error.message ||
            "Unable to connect to the server.",
            "error"
        );

        loginButton.disabled = false;

        loginButton.innerHTML =
            '<span>Login</span>' +
            '<i class="fa-solid fa-arrow-right"></i>';
    }
});