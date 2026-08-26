// ==============================
// ADMIN DASHBOARD
// ==============================


// ==============================
// SECTION NAVIGATION
// ==============================

const menuButtons = document.querySelectorAll(".menu-btn");
const actionButtons = document.querySelectorAll(".action-btn");

const sections = document.querySelectorAll(
    ".dashboard-section, .page-section"
);


// Show selected section

function showSection(sectionId) {

    sections.forEach((section) => {
        section.classList.add("hidden");
    });

    const selectedSection = document.getElementById(sectionId);

    if (selectedSection) {
        selectedSection.classList.remove("hidden");
    }


    // Update sidebar active button

    menuButtons.forEach((button) => {

        button.classList.remove("active");

        if (button.dataset.section === sectionId) {
            button.classList.add("active");
        }

    });
}


// Sidebar buttons

menuButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const section = button.dataset.section;

        showSection(section);

    });

});


// Quick action buttons

actionButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const section = button.dataset.section;

        showSection(section);

    });

});


// ==============================
// LOGOUT
// ==============================

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", () => {

    const confirmLogout = confirm(
        "Are you sure you want to logout?"
    );

    if (confirmLogout) {

        window.location.href = "login.html";

    }

});


// ==============================
// LOAD PRODUCTS
// ==============================

async function loadProductCount() {

    try {

        const response = await fetch(
            "http://localhost:5000/api/products"
        );

        const data = await response.json();

        if (data.success) {

            document.getElementById(
                "totalProducts"
            ).textContent = data.count;

        }

    } catch (error) {

        console.error(
            "Error loading products:",
            error
        );

        document.getElementById(
            "totalProducts"
        ).textContent = "0";

    }

}


// ==============================
// INITIALIZE DASHBOARD
// ==============================

document.addEventListener("DOMContentLoaded", () => {

    loadProductCount();

});