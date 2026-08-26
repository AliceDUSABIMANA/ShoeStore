document.addEventListener("DOMContentLoaded", function () {

    // ==============================
    // MOBILE MENU
    // ==============================

    const navMenu = document.querySelector(".nav-menu");

    // Create mobile menu button
    const menuButton = document.createElement("button");

    menuButton.classList.add("mobile-menu-button");

    menuButton.innerHTML = '<i class="fa-solid fa-bars"></i>';

    // Add button to navigation
    const navContainer = document.querySelector(".nav-container");

    if (navContainer) {
        navContainer.appendChild(menuButton);
    }

    // Open / close mobile menu
    menuButton.addEventListener("click", function () {

        navMenu.classList.toggle("mobile-active");

        if (navMenu.classList.contains("mobile-active")) {
            menuButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        } else {
            menuButton.innerHTML = '<i class="fa-solid fa-bars"></i>';
        }

    });


    // ==============================
    // CLOSE MOBILE MENU
    // ==============================

    const navLinks = document.querySelectorAll(".nav-menu a");

    navLinks.forEach(function (link) {

        link.addEventListener("click", function () {

            navMenu.classList.remove("mobile-active");

            menuButton.innerHTML =
                '<i class="fa-solid fa-bars"></i>';

        });

    });


    // ==============================
    // ACTIVE NAVIGATION
    // ==============================

    navLinks.forEach(function (link) {

        link.addEventListener("click", function () {

            navLinks.forEach(function (item) {
                item.classList.remove("active");
            });

            this.classList.add("active");

        });

    });


    // ==============================
    // SMOOTH SCROLL
    // ==============================

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId = this.getAttribute("href");

            if (targetId === "#") {
                return;
            }

            const target = document.querySelector(targetId);

            if (target) {

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    });


    // ==============================
    // SCROLL NAVBAR EFFECT
    // ==============================

    const navbar = document.querySelector(".navbar");

    window.addEventListener("scroll", function () {

        if (window.scrollY > 50) {

            navbar.classList.add("navbar-scrolled");

        } else {

            navbar.classList.remove("navbar-scrolled");

        }

    });


    // ==============================
    // BUTTON HOVER EFFECT
    // ==============================

    const buttons = document.querySelectorAll(
        ".btn-primary, .btn-secondary, .cta-button"
    );

    buttons.forEach(function (button) {

        button.addEventListener("mouseenter", function () {
            this.style.transform = "translateY(-2px)";
        });

        button.addEventListener("mouseleave", function () {
            this.style.transform = "translateY(0)";
        });

    });


    // ==============================
    // WEBSITE LOADED
    // ==============================

    console.log("ShoeStore website loaded successfully.");

});



document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");

    const emailInput = document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const passwordToggle =
        document.getElementById("passwordToggle");

    const loginMessage =
        document.getElementById("loginMessage");

    const forgotPassword =
        document.getElementById("forgotPassword");


    // =========================
    // PASSWORD SHOW / HIDE
    // =========================

    if (passwordToggle) {

        passwordToggle.addEventListener("click", function () {

            if (passwordInput.type === "password") {

                passwordInput.type = "text";

                passwordToggle.innerHTML =
                    '<i class="fa-regular fa-eye-slash"></i>';

            } else {

                passwordInput.type = "password";

                passwordToggle.innerHTML =
                    '<i class="fa-regular fa-eye"></i>';

            }

        });

    }


    // =========================
    // LOGIN
    // =========================

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value.trim();


        // DEMO LOGIN
        // We will replace this with
        // a real database later.

        const correctEmail =
            "customer@shoestore.com";

        const correctPassword =
            "123456";


        // Clear previous message

        loginMessage.textContent = "";


        // Check login

        if (
            email === correctEmail &&
            password === correctPassword
        ) {

            // Save login status

            localStorage.setItem(
                "shoeStoreLoggedIn",
                "true"
            );

            localStorage.setItem(
                "shoeStoreUser",
                email
            );


            // Success message

            loginMessage.textContent =
                "Login successful! Redirecting...";

            loginMessage.style.color =
                "#16803c";


            // Redirect to homepage

            setTimeout(function () {

                window.location.href =
                    "index.html";

            }, 800);


        } else {

            loginMessage.textContent =
                "Incorrect email or password.";

            loginMessage.style.color =
                "#d62828";

        }

    });


    // =========================
    // FORGOT PASSWORD
    // =========================

    if (forgotPassword) {

        forgotPassword.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                loginMessage.textContent =
                    "Password recovery will be available soon.";

                loginMessage.style.color =
                    "#16803c";

            }
        );

    }

});