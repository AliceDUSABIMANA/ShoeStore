// ================================
// REAL BACKEND LOGIN
// ================================

fetch("http://localhost:5000/api/auth/login", {
    method: "POST",

    headers: {
        "Content-Type": "application/json"
    },

    body: JSON.stringify({
        email: email,
        password: password
    })
})
.then(async function (response) {

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(
            data.message || "Login failed."
        );
    }

    return data;
})
.then(function (data) {

    console.log("Login response:", data);

    // Save the logged-in user
    localStorage.setItem(
        "shoeStoreUser",
        JSON.stringify(data.user)
    );

    // Show success
    showMessage(
        "Login successful! Welcome to ShoeStore.",
        "success"
    );

    loginButton.innerHTML =
        '<span>Login Successful</span>' +
        '<i class="fa-solid fa-check"></i>';

    // ================================
    // REDIRECT BY ROLE
    // ================================

    setTimeout(function () {

        if (data.user.role === "admin") {

            window.location.href = "admin-dashboard.html";

        } else if (data.user.role === "customer") {

            window.location.href = "index.html";

        } else if (data.user.role === "deliveryman") {

            window.location.href = "deliveryman-dashboard.html";

        } else {

            showMessage(
                "Unknown user role.",
                "error"
            );

            loginButton.disabled = false;
        }

    }, 800);

})
.catch(function (error) {

    console.error("Login error:", error);

    showMessage(
        error.message || "Unable to connect to the server.",
        "error"
    );

    loginButton.disabled = false;

    loginButton.innerHTML =
        '<span>Login</span>' +
        '<i class="fa-solid fa-arrow-right"></i>';

});