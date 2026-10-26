// ============================================================
// SHOESTORE - ADMIN DASHBOARD JAVASCRIPT
// ============================================================

const API_URL = "http://127.0.0.1:5000/api";

// ============================================================
// GLOBAL VARIABLES
// ============================================================

let currentUser = null;

let allProducts = [];
let allOrders = [];
let allCustomers = [];
let allDeliverymen = [];
let allDeliveries = [];
let allPayments = [];

let selectedTrackingDeliveryId = null;
let trackingTimer = null;

let currentProductAutoImage = "";

const DELIVERYMAN_RATE = 1500;

const orderDetailsCache = new Map();


// ============================================================
// API REQUEST
// ============================================================

async function apiRequest(endpoint, options = {}) {
    const config = {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...config,
        cache: "no-store"
    });

    let data = {};

    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            `Request failed with status ${response.status}`
        );
    }

    if (data.success === false) {
        throw new Error(
            data.message ||
            data.error ||
            "Request failed."
        );
    }

    return data;
}
// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        try {

            checkAdminAccess();

            setupNavigation();

            setupLogout();

            setupProductEvents();

            setupSearchAndFilters();

            setupGlobalModalEvents();

            setupDashboardRefresh();

            setupTrackingRefresh();

            setupReportFilters();

            displayAdminInformation();

            await loadAllAdminData();

            showSection("dashboard");

        } catch (error) {

            console.error(
                "Admin dashboard initialization error:",
                error
            );

            showToast(
                error.message ||
                "Failed to load admin dashboard.",
                "error"
            );
        }
    }
);


// ============================================================
// ADMIN ACCESS
// ============================================================

function checkAdminAccess() {

    const possibleUser =
        localStorage.getItem("currentUser") ||
        localStorage.getItem("user");

    if (!possibleUser) {

        console.warn(
            "No logged-in user information found."
        );

        return;
    }

    try {

        currentUser =
            JSON.parse(possibleUser);

    } catch (error) {

        console.error(
            "Unable to read current user:",
            error
        );

        currentUser = null;
    }

    if (
        currentUser &&
        currentUser.role &&
        currentUser.role !== "admin"
    ) {

        alert(
            "Access denied. Administrator account required."
        );

        window.location.href = "login.html";

        return;
    }
}


// ============================================================
// ADMIN INFORMATION
// ============================================================

function displayAdminInformation() {

    if (!currentUser) {
        return;
    }

    const fullName =
        `${currentUser.first_name || ""} ${currentUser.last_name || ""}`
            .trim();

    const name =
        fullName ||
        currentUser.name ||
        "Administrator";

    const email =
        currentUser.email ||
        "-";

    const adminName =
        document.getElementById("adminName");

    const profileName =
        document.getElementById("profileName");

    const profileEmail =
        document.getElementById("profileEmail");

    if (adminName) {
        adminName.textContent = name;
    }

    if (profileName) {
        profileName.textContent = name;
    }

    if (profileEmail) {
        profileEmail.textContent = email;
    }
}


// ============================================================
// NAVIGATION
// ============================================================

function setupNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item, .quick-action, .text-button"
        );

    navItems.forEach(function (item) {

        item.addEventListener(
            "click",
            function () {

                const section =
                    item.dataset.section;

                if (section) {
                    showSection(section);
                }
            }
        );
    });
}


async function showSection(sectionId) {

    // =====================================================
    // HIDE ALL SECTIONS
    // =====================================================

    document.querySelectorAll(".page-section").forEach(section => {
        section.classList.add("hidden");
        section.classList.remove("active");
    });


    // =====================================================
    // SHOW SELECTED SECTION
    // =====================================================

    const targetSection = document.getElementById(sectionId);

    if (targetSection) {
        targetSection.classList.remove("hidden");
        targetSection.classList.add("active");
    }


    // =====================================================
    // UPDATE ACTIVE SIDEBAR ITEM
    // =====================================================

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });

    const activeNav = document.querySelector(
        `.nav-item[data-section="${sectionId}"]`
    );

    if (activeNav) {
        activeNav.classList.add("active");
    }


    // =====================================================
    // PAGE TITLES
    // =====================================================

    const titles = {
        dashboard: "Dashboard",
        products: "Products",
        orders: "Orders",
        customers: "Customers",
        deliverymen: "Deliverymen",
        tracking: "Delivery Tracking",
        payments: "Payments",
        reports: "Reports",
        profile: "Profile"
    };

    const pageTitle = document.getElementById("pageTitle");

    if (pageTitle && titles[sectionId]) {
        pageTitle.textContent = titles[sectionId];
    }


    // =====================================================
    // PAGE DESCRIPTIONS
    // =====================================================

    const descriptions = {
        dashboard: "Manage your ShoeStore system.",
        products: "Manage products in your store.",
        orders: "Manage customer orders and deliveries.",
        customers: "View registered customers.",
        deliverymen: "Manage delivery personnel.",
        tracking: "Monitor active deliverymen in real time.",
        payments: "Monitor customer payments.",
        reports: "Monitor store performance and delivery earnings.",
        profile: "Administrator account information."
    };

    const pageDescription = document.getElementById("pageDescription");

    if (pageDescription && descriptions[sectionId]) {
        pageDescription.textContent = descriptions[sectionId];
    }


    // =====================================================
    // ORDERS
    // =====================================================

    if (sectionId === "orders") {
        try {
            await Promise.all([
                loadOrders(),
                loadDeliveries()
            ]);
        } catch (error) {
            console.error("Error refreshing orders:", error);
        }
    }


    // =====================================================
    // DELIVERY TRACKING
    // =====================================================

    if (sectionId === "tracking") {
        try {
            await loadDeliveries();
            displayTracking();
            startTrackingRefresh();
        } catch (error) {
            console.error("Error refreshing tracking:", error);
        }
    } else {
        stopTrackingRefresh();
    }


    // =====================================================
    // REPORTS
    // =====================================================

    if (sectionId === "reports") {
        try {
            await Promise.all([
                loadDeliveries(),
                loadOrders(),
                loadDeliverymen()
            ]);

            updateReports();

        } catch (error) {
            console.error("Error refreshing reports:", error);
        }
    }


    // =====================================================
    // PRODUCTS
    // =====================================================

    if (sectionId === "products") {
        displayProducts();
    }


    // =====================================================
    // CUSTOMERS
    // =====================================================

    if (sectionId === "customers") {
        displayCustomers();
    }


    // =====================================================
    // DELIVERYMEN
    // =====================================================

    if (sectionId === "deliverymen") {
        displayDeliverymen();
    }


    // =====================================================
    // PAYMENTS
    // =====================================================

    if (sectionId === "payments") {
        displayPayments();
    }
}

function updatePageTitle(sectionId) {

    const pageTitle =
        document.getElementById("pageTitle");

    const pageDescription =
        document.getElementById("pageDescription");

    const pages = {

        dashboard: [
            "Admin Dashboard",
            "Manage your ShoeStore system."
        ],

        products: [
            "Products",
            "Manage products in your store."
        ],

        orders: [
            "Orders",
            "Manage customer orders and deliveries."
        ],

        customers: [
            "Customers",
            "View registered customers."
        ],

        deliverymen: [
            "Deliverymen",
            "Manage delivery personnel."
        ],

        tracking: [
            "Delivery Tracking",
            "Monitor active deliverymen in real time."
        ],

        payments: [
            "Payments",
            "Monitor customer payments."
        ],

        reports: [
            "Reports",
            "Monitor store performance and delivery earnings."
        ],

        profile: [
            "Admin Profile",
            "Administrator account information."
        ]
    };

    const data =
        pages[sectionId];

    if (!data) {
        return;
    }

    if (pageTitle) {
        pageTitle.textContent = data[0];
    }

    if (pageDescription) {
        pageDescription.textContent = data[1];
    }
}


// ============================================================
// LOGOUT
// ============================================================

function setupLogout() {

    const logoutBtn =
        document.getElementById("logoutBtn");

    if (!logoutBtn) {
        return;
    }

    logoutBtn.addEventListener(
        "click",
        function () {

            localStorage.removeItem("currentUser");
            localStorage.removeItem("user");

            window.location.href = "login.html";
        }
    );
}


// ============================================================
// LOAD ALL ADMIN DATA
// ============================================================

async function loadAllAdminData() {

    const results =
        await Promise.allSettled([

            loadProducts(),

            loadOrders(),

            loadCustomers(),

            loadDeliverymen(),

            loadDeliveries(),

            loadPayments()

        ]);

    results.forEach(
        function (result, index) {

            if (
                result.status ===
                "rejected"
            ) {

                console.error(
                    `Admin data request ${index + 1} failed:`,
                    result.reason
                );
            }
        }
    );

    updateDashboardStatistics();

    updateReports();
}


// ============================================================
// PRODUCTS
// ============================================================

async function loadProducts() {

    const data =
        await apiRequest(
            "/products"
        );

    allProducts =
        Array.isArray(data.products)
            ? data.products
            : Array.isArray(data)
                ? data
                : [];

    displayProducts();

    updateDashboardStatistics();
}


function displayProducts() {

    const table =
        document.getElementById(
            "productsTable"
        );

    if (!table) {
        return;
    }

    if (!allProducts.length) {

        table.innerHTML = `
            <tr>
                <td colspan="8">
                    No products found.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        allProducts.map(
            function (product) {

                return `
                    <tr>

                        <td>
                            ${escapeHtml(product.id)}
                        </td>

                        <td>
                            ${
                                product.image_url ||
                                product.image
                                    ? `
                                        <img
                                            src="${escapeAttribute(
                                                product.image_url ||
                                                product.image
                                            )}"
                                            alt="Product"
                                            style="
                                                width:50px;
                                                height:50px;
                                                object-fit:cover;
                                                border-radius:8px;
                                            "
                                        >
                                      `
                                    : "—"
                            }
                        </td>

                        <td>
                            ${escapeHtml(
                                product.name || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                product.brand || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                product.category || "-"
                            )}
                        </td>

                        <td>
                            ${formatMoney(
                                product.price
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                product.stock_quantity ??
                                product.stock ??
                                0
                            )}
                        </td>

                        <td>

                            <button
                                class="btn btn-secondary"
                                onclick="editProduct(${Number(product.id)})"
                            >
                                Edit
                            </button>

                            <button
                                class="btn btn-danger"
                                onclick="deleteProduct(${Number(product.id)})"
                            >
                                Delete
                            </button>

                        </td>

                    </tr>
                `;
            }
        ).join("");
}


// ============================================================
// PRODUCT MODAL
// ============================================================

function setupProductEvents() {

    const addProductBtn =
        document.getElementById(
            "addProductBtn"
        );

    const productForm =
        document.getElementById(
            "productForm"
        );

    if (addProductBtn) {

        addProductBtn.addEventListener(
            "click",
            function () {

                openProductModal();

            }
        );
    }

    if (productForm) {

        productForm.addEventListener(
            "submit",
            saveProduct
        );
    }

    document.querySelectorAll(
        ".close-product-modal"
    ).forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    closeModal(
                        "productModal"
                    );

                }
            );
        }
    );
}


function openProductModal(product = null) {

    const modal =
        document.getElementById(
            "productModal"
        );

    if (!modal) {
        return;
    }

    const title =
        modal.querySelector(
            ".modal-header h2"
        );

    if (title) {

        title.textContent =
            product
                ? "Edit Product"
                : "Add Product";
    }

    setInputValue(
        "productId",
        product?.id || ""
    );

    setInputValue(
        "productName",
        product?.name || ""
    );

    setInputValue(
        "productBrand",
        product?.brand || ""
    );

    setInputValue(
        "productCategory",
        product?.category || ""
    );

    setInputValue(
        "productSize",
        product?.size || ""
    );

    setInputValue(
        "productPrice",
        product?.price || ""
    );

    setInputValue(
        "productStock",
        product?.stock_quantity ??
        product?.stock ??
        ""
    );

    setInputValue(
        "productImage",
        product?.image_url ||
        product?.image ||
        ""
    );

    setInputValue(
        "productDescription",
        product?.description || ""
    );

    modal.classList.remove("hidden");
}


function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (modal) {
        modal.classList.add("hidden");
    }
}


function openProductModalFromId(id) {

    const product =
        allProducts.find(
            function (item) {

                return Number(item.id) ===
                    Number(id);

            }
        );

    if (product) {

        openProductModal(product);
    }
}


window.editProduct =
    openProductModalFromId;


async function saveProduct(event) {

    event.preventDefault();

    const id =
        document.getElementById(
            "productId"
        )?.value;

    const product = {

        name:
            document.getElementById(
                "productName"
            )?.value.trim(),

        brand:
            document.getElementById(
                "productBrand"
            )?.value.trim(),

        category:
            document.getElementById(
                "productCategory"
            )?.value,

        size:
            document.getElementById(
                "productSize"
            )?.value.trim(),

        price:
            Number(
                document.getElementById(
                    "productPrice"
                )?.value || 0
            ),

        stock_quantity:
            Number(
                document.getElementById(
                    "productStock"
                )?.value || 0
            ),

        image_url:
            document.getElementById(
                "productImage"
            )?.value.trim(),

        description:
            document.getElementById(
                "productDescription"
            )?.value.trim()

    };

    try {

        const endpoint =
            id
                ? `/products/${id}`
                : "/products";

        const method =
            id
                ? "PUT"
                : "POST";

        const data =
            await apiRequest(
                endpoint,
                {
                    method,
                    body: JSON.stringify(product)
                }
            );

        closeModal("productModal");

        showToast(
            data.message ||
            (
                id
                    ? "Product updated successfully."
                    : "Product added successfully."
            ),
            "success"
        );

        await loadProducts();

    } catch (error) {

        console.error(
            "Save product error:",
            error
        );

        showToast(
            error.message ||
            "Unable to save product.",
            "error"
        );
    }
}


async function deleteProduct(id) {

    if (
        !confirm(
            "Are you sure you want to delete this product?"
        )
    ) {

        return;
    }

    try {

        const data =
            await apiRequest(
                `/products/${id}`,
                {
                    method: "DELETE"
                }
            );

        showToast(
            data.message ||
            "Product deleted successfully.",
            "success"
        );

        await loadProducts();

    } catch (error) {

        console.error(
            "Delete product error:",
            error
        );

        showToast(
            error.message ||
            "Unable to delete product.",
            "error"
        );
    }
}

window.deleteProduct =
    deleteProduct;


// ============================================================
// ORDERS
// ============================================================

async function loadOrders() {

    const data =
        await apiRequest(
            "/orders"
        );

    allOrders =
        Array.isArray(data.orders)
            ? data.orders
            : Array.isArray(data)
                ? data
                : [];

    displayOrders();

    updateDashboardStatistics();
}


function displayOrders() {

    const table =
        document.getElementById(
            "ordersTable"
        );

    if (!table) {
        return;
    }

    if (!allOrders.length) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    No orders found.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        allOrders.map(
            function (order) {

                const delivery =
                    getDeliveryForOrder(
                        order.id
                    );

                const deliveryman =
                    delivery
                        ? getDeliverymanName(
                            delivery.deliveryman_id
                        )
                        : null;

                return `
                    <tr>

                        <td>
                            #${escapeHtml(order.id)}
                        </td>

                        <td>
                            ${escapeHtml(
                                getOrderCustomerName(order)
                            )}
                        </td>

                        <td>
                            ${formatMoney(
                                order.total_amount ??
                                order.total ??
                                0
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                getOrderPaymentStatus(order)
                            )}
                        </td>

                        <td>
                            <span class="status-badge">
                                ${formatStatus(
                                    order.order_status ||
                                    order.status
                                )}
                            </span>
                        </td>

                        <td>
                            ${escapeHtml(
                                deliveryman ||
                                "Not assigned"
                            )}
                        </td>

                        <td>

                            <button
                                class="btn btn-primary"
                                onclick="openAssignDelivery(${Number(order.id)})"
                            >
                                Assign
                            </button>

                        </td>

                    </tr>
                `;
            }
        ).join("");
}


function getOrderCustomerName(order) {

    if (order.customer_name) {
        return order.customer_name;
    }

    const first =
        order.first_name ||
        order.customer_first_name ||
        "";

    const last =
        order.last_name ||
        order.customer_last_name ||
        "";

    const name =
        `${first} ${last}`.trim();

    return name || "Customer";
}


function getOrderPaymentStatus(order) {

    return (
        order.payment_status ||
        order.payment_method ||
        "—"
    );
}


// ============================================================
// CUSTOMERS
// ============================================================

async function loadCustomers() {

    const data =
        await apiRequest(
            "/users/customers"
        );

    allCustomers =
        Array.isArray(data.customers)
            ? data.customers
            : Array.isArray(data.users)
                ? data.users
                : Array.isArray(data)
                    ? data
                    : [];

    displayCustomers();

    updateDashboardStatistics();
}


function displayCustomers() {

    const table =
        document.getElementById(
            "customersTable"
        );

    if (!table) {
        return;
    }

    if (!allCustomers.length) {

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    No customers found.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        allCustomers.map(
            function (customer) {

                const name =
                    `${customer.first_name || ""} ${customer.last_name || ""}`
                        .trim();

                const orderCount =
                    customer.order_count ??
                    customer.orders_count ??
                    customer.orders ??
                    0;

                return `
                    <tr>

                        <td>
                            ${escapeHtml(customer.id)}
                        </td>

                        <td>
                            ${escapeHtml(
                                name || "Customer"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                customer.email || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                customer.phone || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(orderCount)}
                        </td>

                        <td>
                            ${formatDate(
                                customer.created_at
                            )}
                        </td>

                    </tr>
                `;
            }
        ).join("");
}


// ============================================================
// DELIVERYMEN
// ============================================================

async function loadDeliverymen() {

    const data =
        await apiRequest(
            "/users/deliverymen"
        );

    allDeliverymen =
        Array.isArray(data.deliverymen)
            ? data.deliverymen
            : Array.isArray(data.users)
                ? data.users
                : Array.isArray(data)
                    ? data
                    : [];

    displayDeliverymen();

    updateReports();
}


function displayDeliverymen() {

    const table =
        document.getElementById(
            "deliverymenTable"
        );

    if (!table) {
        return;
    }

    if (!allDeliverymen.length) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    No deliverymen found.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        allDeliverymen.map(
            function (person) {

                const deliveryCount =
                    allDeliveries.filter(
                        function (delivery) {

                            return Number(
                                delivery.deliveryman_id
                            ) === Number(person.id);

                        }
                    ).length;

                const status =
                    getDeliverymanCurrentStatus(
                        person.id
                    );

                return `
                    <tr>

                        <td>
                            ${escapeHtml(person.id)}
                        </td>

                        <td>
                            ${escapeHtml(
                                `${person.first_name || ""} ${person.last_name || ""}`
                                    .trim()
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                person.email || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                person.phone || "-"
                            )}
                        </td>

                        <td>
                            ${deliveryCount}
                        </td>

                        <td>
                            <span class="status-badge">
                                ${formatStatus(status)}
                            </span>
                        </td>

                        <td>
                            <button
                                class="btn btn-secondary"
                                onclick="editDeliveryman(${Number(person.id)})"
                            >
                                Edit
                            </button>

                            <button
                                class="btn btn-danger"
                                onclick="deleteDeliveryman(${Number(person.id)})"
                            >
                                Delete
                            </button>
                        </td>

                    </tr>
                `;
            }
        ).join("");
}


function getDeliverymanCurrentStatus(
    deliverymanId
) {

    const deliveries =
        allDeliveries.filter(
            function (delivery) {

                return Number(
                    delivery.deliveryman_id
                ) === Number(deliverymanId);

            }
        );

    if (!deliveries.length) {
        return "available";
    }

    const priority = [
        "on_the_way",
        "started",
        "assigned",
        "delivered",
        "cancelled"
    ];

    for (
        let i = 0;
        i < priority.length;
        i++
    ) {

        const found =
            deliveries.find(
                function (delivery) {

                    return delivery.delivery_status ===
                        priority[i];

                }
            );

        if (found) {
            return priority[i];
        }
    }

    return "available";
}


// ============================================================
// DELIVERY DATA
// ============================================================

async function loadDeliveries() {

    const data =
        await apiRequest(
            "/deliveries"
        );

    allDeliveries =
        Array.isArray(data.deliveries)
            ? data.deliveries
            : Array.isArray(data)
                ? data
                : [];

    displayTracking();

    displayDeliverymen();

    displayOrders();

    updateReports();
}


// ============================================================
// FIND DELIVERY FOR ORDER
// ============================================================

function getDeliveryForOrder(orderId) {

    return (
        allDeliveries.find(
            function (delivery) {

                return Number(
                    delivery.order_id
                ) === Number(orderId);

            }
        ) || null
    );
}


// ============================================================
// GET DELIVERYMAN NAME
// ============================================================

function getDeliverymanName(id) {

    if (!id) {
        return null;
    }

    const person =
        allDeliverymen.find(
            function (item) {

                return Number(item.id) ===
                    Number(id);

            }
        );

    if (!person) {
        return null;
    }

    return (
        `${person.first_name || ""} ${person.last_name || ""}`
            .trim()
        || null
    );
}


// ============================================================
// ASSIGN DELIVERYMAN
// ============================================================

function openAssignDelivery(orderId) {

    const order =
        allOrders.find(
            function (item) {

                return Number(item.id) ===
                    Number(orderId);

            }
        );

    if (!order) {

        showToast(
            "Order not found.",
            "error"
        );

        return;
    }

    let modal =
        document.getElementById(
            "assignDeliveryModal"
        );

    if (!modal) {

        createAssignDeliveryModal();

        modal =
            document.getElementById(
                "assignDeliveryModal"
            );
    }

    const orderInput =
        document.getElementById(
            "assignOrderId"
        );

    const select =
        document.getElementById(
            "assignDeliverymanId"
        );

    if (orderInput) {
        orderInput.value =
            orderId;
    }

    if (select) {

        select.innerHTML = `
            <option value="">
                Select deliveryman
            </option>
        `;

        allDeliverymen.forEach(
            function (person) {

                const name =
                    `${person.first_name || ""} ${person.last_name || ""}`
                        .trim();

                select.innerHTML += `
                    <option value="${Number(person.id)}">
                        ${escapeHtml(name || "Deliveryman")}
                    </option>
                `;
            }
        );

        const existing =
            getDeliveryForOrder(orderId);

        if (
            existing &&
            existing.deliveryman_id
        ) {

            select.value =
                String(
                    existing.deliveryman_id
                );
        }
    }

    modal.classList.remove("hidden");
}


window.openAssignDelivery =
    openAssignDelivery;


function createAssignDeliveryModal() {

    const modal =
        document.createElement("div");

    modal.id =
        "assignDeliveryModal";

    modal.className =
        "modal hidden";

    modal.innerHTML = `

        <div class="modal-content">

            <div class="modal-header">

                <h2>Assign Deliveryman</h2>

                <button
                    type="button"
                    class="close-btn"
                    id="closeAssignDeliveryBtn">
                    &times;
                </button>

            </div>

            <form id="assignDeliveryForm">

                <input
                    type="hidden"
                    id="assignOrderId">

                <label>
                    Deliveryman

                    <select
                        id="assignDeliverymanId"
                        required>
                    </select>

                </label>

                <div class="modal-actions">

                    <button
                        type="button"
                        class="btn btn-secondary"
                        id="cancelAssignDeliveryBtn">
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="btn btn-primary">
                        Assign
                    </button>

                </div>

            </form>

        </div>
    `;

    document.body.appendChild(modal);

    document
        .getElementById(
            "closeAssignDeliveryBtn"
        )
        .addEventListener(
            "click",
            function () {

                closeModal(
                    "assignDeliveryModal"
                );

            }
        );

    document
        .getElementById(
            "cancelAssignDeliveryBtn"
        )
        .addEventListener(
            "click",
            function () {

                closeModal(
                    "assignDeliveryModal"
                );

            }
        );

    document
        .getElementById(
            "assignDeliveryForm"
        )
        .addEventListener(
            "submit",
            assignDelivery
        );
}


async function assignDelivery(event) {

    event.preventDefault();

    const orderId =
        Number(
            document.getElementById(
                "assignOrderId"
            )?.value
        );

    const deliverymanId =
        Number(
            document.getElementById(
                "assignDeliverymanId"
            )?.value
        );

    if (!orderId || !deliverymanId) {

        showToast(
            "Please select a deliveryman.",
            "warning"
        );

        return;
    }

    try {

        const data =
            await apiRequest(
                `/deliveries/order/${orderId}/assign`,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        deliveryman_id:
                            deliverymanId
                    })
                }
            );

        closeModal(
            "assignDeliveryModal"
        );

        showToast(
            data.message ||
            "Deliveryman assigned successfully.",
            "success"
        );

        await Promise.all([
            loadDeliveries(),
            loadOrders(),
            loadDeliverymen()
        ]);

        updateDashboardStatistics();

        updateReports();

    } catch (error) {

        console.error(
            "Assign deliveryman error:",
            error
        );

        showToast(
            error.message ||
            "Failed to assign deliveryman.",
            "error"
        );
    }
}


// ============================================================
// UPDATE DELIVERY STATUS
// ============================================================

async function updateDeliveryStatus(
    deliveryId,
    status
) {

    if (!deliveryId || !status) {

        return false;
    }

    try {

        await apiRequest(
            `/deliveries/${deliveryId}/status`,
            {
                method: "PUT",

                body: JSON.stringify({
                    status: status
                })
            }
        );

        await loadDeliveries();

        alert(
            `Delivery status updated to ${formatStatus(status)}.`
        );

        if (
            status === "started" ||
            status === "on_the_way"
        ) {

            showSection("tracking");
        }

        return true;

    } catch (error) {

        console.error(
            "Status update error:",
            error
        );

        alert(
            "Unable to update delivery status: " +
            error.message
        );

        return false;
    }
}


window.updateDeliveryStatus =
    updateDeliveryStatus;


// ============================================================
// TRACKING
// ============================================================

function displayTracking() {

    const container =
        document.getElementById(
            "activeDeliveries"
        );

    if (!container) {
        return;
    }

    const active =
        allDeliveries.filter(
            function (delivery) {

                return [
                    "assigned",
                    "started",
                    "on_the_way"
                ].includes(
                    delivery.delivery_status
                );

            }
        );

    if (!active.length) {

        container.innerHTML = `
            <div class="empty-state">
                No active deliveries.
            </div>
        `;

        return;
    }

    container.innerHTML =
        active.map(
            function (delivery) {

                const name =
                    getDeliverymanName(
                        delivery.deliveryman_id
                    ) ||
                    "Not assigned";

                return `
                    <div
                        class="tracking-item"
                        data-delivery-id="${Number(delivery.id)}"
                        onclick="selectTrackingDelivery(${Number(delivery.id)})"
                    >

                        <strong>
                            Order #${escapeHtml(
                                delivery.order_id
                            )}
                        </strong>

                        <div>
                            ${escapeHtml(name)}
                        </div>

                        <small>
                            ${formatStatus(
                                delivery.delivery_status
                            )}
                        </small>

                    </div>
                `;
            }
        ).join("");
}


function selectTrackingDelivery(
    deliveryId
) {

    selectedTrackingDeliveryId =
        Number(deliveryId);

    const delivery =
        allDeliveries.find(
            function (item) {

                return Number(item.id) ===
                    Number(deliveryId);

            }
        );

    if (!delivery) {
        return;
    }

    loadLatestLocation(delivery.id);
}


window.selectTrackingDelivery =
    selectTrackingDelivery;


async function loadLatestLocation(
    deliveryId
) {

    try {

        const data =
            await apiRequest(
                `/deliveries/${deliveryId}/location`
            );

        const location =
            data.location ||
            data.deliveryLocation ||
            null;

        displayDeliveryLocation(
            location
        );

    } catch (error) {

        console.error(
            "Location loading error:",
            error
        );

        displayDeliveryLocation(null);
    }
}


function displayDeliveryLocation(
    location
) {

    const map =
        document.getElementById(
            "deliveryMap"
        );

    if (!map) {
        return;
    }

    if (
        !location ||
        location.latitude === undefined ||
        location.longitude === undefined
    ) {

        map.innerHTML = `

            <div class="map-placeholder">

                <h3>Delivery Map</h3>

                <p>
                    No GPS location available for
                    this delivery yet.
                </p>

            </div>
        `;

        return;
    }

    const latitude =
        Number(location.latitude);

    const longitude =
        Number(location.longitude);

    map.innerHTML = `

        <div class="map-placeholder">

            <h3>Delivery Location</h3>

            <p>
                Latitude:
                ${latitude}
            </p>

            <p>
                Longitude:
                ${longitude}
            </p>

            <a
                href="https://www.google.com/maps?q=${latitude},${longitude}"
                target="_blank"
                rel="noopener noreferrer">
                Open Location in Google Maps
            </a>

        </div>
    `;
}


// ============================================================
// TRACKING REFRESH
// ============================================================

function setupTrackingRefresh() {

    const button =
        document.getElementById(
            "refreshButton"
        );

    if (button) {

        button.addEventListener(
            "click",
            async function () {

                await loadDeliveries();

                if (
                    selectedTrackingDeliveryId
                ) {

                    await loadLatestLocation(
                        selectedTrackingDeliveryId
                    );
                }

            }
        );
    }
}


function startTrackingRefresh() {

    stopTrackingRefresh();

    trackingTimer =
        setInterval(
            async function () {

                try {

                    await loadDeliveries();

                    if (
                        selectedTrackingDeliveryId
                    ) {

                        await loadLatestLocation(
                            selectedTrackingDeliveryId
                        );
                    }

                } catch (error) {

                    console.error(
                        "Tracking refresh error:",
                        error
                    );
                }

            },
            30000
        );
}


function stopTrackingRefresh() {

    if (trackingTimer) {

        clearInterval(
            trackingTimer
        );

        trackingTimer = null;
    }
}


// ============================================================
// PAYMENTS
// ============================================================

async function loadPayments() {

    const data =
        await apiRequest(
            "/payments"
        );

    allPayments =
        Array.isArray(data.payments)
            ? data.payments
            : Array.isArray(data)
                ? data
                : [];

    displayPayments();
}


function displayPayments() {

    const table =
        document.getElementById(
            "paymentsTable"
        );

    if (!table) {
        return;
    }

    updatePaymentStatistics();

    if (!allPayments.length) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    No payments found.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        allPayments.map(
            function (payment) {

                return `
                    <tr>

                        <td>
                            ${escapeHtml(payment.id)}
                        </td>

                        <td>
                            ${escapeHtml(
                                payment.order_id || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                payment.customer_name ||
                                payment.email ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${formatMoney(
                                payment.amount
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                payment.payment_method ||
                                "-"
                            )}
                        </td>

                        <td>
                            <span class="status-badge">
                                ${formatStatus(
                                    payment.payment_status ||
                                    payment.status
                                )}
                            </span>
                        </td>

                        <td>
                            ${formatDate(
                                payment.created_at
                            )}
                        </td>

                    </tr>
                `;
            }
        ).join("");
}


function updatePaymentStatistics() {

    const total =
        allPayments.length;

    const completed =
        allPayments.filter(
            function (payment) {

                return (
                    payment.payment_status ===
                    "completed" ||
                    payment.payment_status ===
                    "successful" ||
                    payment.status ===
                    "completed"
                );

            }
        ).length;

    const pending =
        allPayments.filter(
            function (payment) {

                return (
                    payment.payment_status ===
                    "pending" ||
                    payment.status ===
                    "pending"
                );

            }
        ).length;

    setText(
        "totalPayments",
        total
    );

    setText(
        "completedPayments",
        completed
    );

    setText(
        "pendingPayments",
        pending
    );
}


// ============================================================
// DASHBOARD STATISTICS
// ============================================================

function updateDashboardStatistics() {

    setText(
        "totalProducts",
        allProducts.length
    );

    setText(
        "totalCustomers",
        allCustomers.length
    );

    setText(
        "totalOrders",
        allOrders.length
    );

    const sales =
        allOrders.reduce(
            function (sum, order) {

                return sum +
                    Number(
                        order.total_amount ??
                        order.total ??
                        0
                    );

            },
            0
        );

    setText(
        "totalSales",
        formatMoney(sales)
    );

    displayRecentOrders();
}


function displayRecentOrders() {

    const table =
        document.getElementById(
            "recentOrdersTable"
        );

    if (!table) {
        return;
    }

    const recent =
        [...allOrders]
            .sort(
                function (a, b) {

                    return Number(b.id) -
                        Number(a.id);

                }
            )
            .slice(0, 5);

    if (!recent.length) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    No orders found.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        recent.map(
            function (order) {

                return `
                    <tr>

                        <td>
                            #${escapeHtml(order.id)}
                        </td>

                        <td>
                            ${escapeHtml(
                                getOrderCustomerName(order)
                            )}
                        </td>

                        <td>
                            ${formatMoney(
                                order.total_amount ??
                                order.total ??
                                0
                            )}
                        </td>

                        <td>
                            ${formatStatus(
                                order.order_status ||
                                order.status
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                order.created_at
                            )}
                        </td>

                    </tr>
                `;
            }
        ).join("");
}


// ============================================================
// REPORTS
// ============================================================

function setupReportFilters() {

    const period =
        document.getElementById(
            "reportPeriod"
        );

    const month =
        document.getElementById(
            "reportMonth"
        );

    const year =
        document.getElementById(
            "reportYear"
        );

    if (period) {

        period.addEventListener(
            "change",
            updateReports
        );
    }

    if (month) {

        month.addEventListener(
            "change",
            updateReports
        );
    }

    if (year) {

        year.addEventListener(
            "change",
            updateReports
        );
    }

    populateReportYears();
}


function populateReportYears() {

    const select =
        document.getElementById(
            "reportYear"
        );

    if (!select) {
        return;
    }

    const currentYear =
        new Date().getFullYear();

    select.innerHTML = "";

    for (
        let year = currentYear - 5;
        year <= currentYear + 1;
        year++
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            String(year);

        option.textContent =
            String(year);

        if (year === currentYear) {
            option.selected = true;
        }

        select.appendChild(option);
    }
}


// ============================================================
// GET FILTERED DELIVERED DELIVERIES
// ============================================================

function getFilteredDeliveredDeliveries() {

    const period =
        document.getElementById(
            "reportPeriod"
        )?.value || "all";

    const monthValue =
        document.getElementById(
            "reportMonth"
        )?.value || "";

    const yearValue =
        document.getElementById(
            "reportYear"
        )?.value || "";

    return allDeliveries.filter(
        function (delivery) {

            // -------------------------------------------------
            // Only successfully delivered deliveries
            // -------------------------------------------------

            if (
                delivery.delivery_status !==
                "delivered"
            ) {

                return false;
            }


            // -------------------------------------------------
            // If report period is "all", don't apply
            // date filtering.
            // -------------------------------------------------

            if (
                period === "all" ||
                period === ""
            ) {

                return true;
            }


            const rawDate =
                delivery.delivered_at ||
                delivery.created_at;


            if (!rawDate) {
                return false;
            }


            const date =
                new Date(rawDate);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return false;
            }


            const deliveryYear =
                date.getFullYear();

            const deliveryMonth =
                date.getMonth() + 1;


            // -------------------------------------------------
            // Year filter
            // -------------------------------------------------

            if (
                yearValue &&
                deliveryYear !==
                Number(yearValue)
            ) {

                return false;
            }


            // -------------------------------------------------
            // Month filter
            // -------------------------------------------------

            if (
                monthValue &&
                deliveryMonth !==
                Number(monthValue)
            ) {

                return false;
            }


            return true;
        }
    );
}


// ============================================================
// UPDATE REPORTS
// ============================================================

function updateReports() {

    setText(
        "reportProducts",
        allProducts.length
    );

    setText(
        "reportProducts2",
        allProducts.length
    );

    setText(
        "reportCustomers",
        allCustomers.length
    );

    setText(
        "reportCustomers2",
        allCustomers.length
    );

    setText(
        "reportOrders",
        allOrders.length
    );

    setText(
        "reportOrders2",
        allOrders.length
    );


    const sales =
        allOrders.reduce(
            function (sum, order) {

                return sum +
                    Number(
                        order.total_amount ??
                        order.total ??
                        0
                    );

            },
            0
        );


    setText(
        "reportSales",
        formatMoney(sales)
    );

    setText(
        "reportSales2",
        formatMoney(sales)
    );


    // ---------------------------------------------------------
    // Deliveryman report
    // ---------------------------------------------------------

    buildDeliverymanReport();
}


// ============================================================
// BUILD DELIVERYMAN REPORT
// ============================================================

function buildDeliverymanReport() {

    // ========================================================
    // GET ONLY DELIVERED DELIVERIES
    // ========================================================

    const delivered =
        getFilteredDeliveredDeliveries();


    // ========================================================
    // GET UNIQUE DELIVERED ORDER IDS
    // ========================================================

    const deliveredOrderIds =
        new Set();

    delivered.forEach(
        function (delivery) {

            if (
                delivery.order_id !== undefined &&
                delivery.order_id !== null
            ) {

                deliveredOrderIds.add(
                    Number(delivery.order_id)
                );
            }
        }
    );


    // ========================================================
    // CALCULATE PRODUCTS DELIVERED
    // ========================================================

    let productsDelivered = 0;

    delivered.forEach(
        function (delivery) {

            const order =
                allOrders.find(
                    function (item) {

                        return Number(item.id) ===
                            Number(delivery.order_id);

                    }
                );


            if (!order) {
                return;
            }


            // ------------------------------------------------
            // If the order already contains its items
            // ------------------------------------------------

            if (
                Array.isArray(order.items)
            ) {

                productsDelivered +=
                    order.items.reduce(
                        function (
                            total,
                            item
                        ) {

                            return total +
                                Number(
                                    item.quantity || 0
                                );

                        },
                        0
                    );
            }


            // ------------------------------------------------
            // If product_count is available
            // ------------------------------------------------

            else if (
                order.product_count !== undefined &&
                order.product_count !== null
            ) {

                productsDelivered +=
                    Number(
                        order.product_count
                    );
            }


            // ------------------------------------------------
            // If total_items is available
            // ------------------------------------------------

            else if (
                order.total_items !== undefined &&
                order.total_items !== null
            ) {

                productsDelivered +=
                    Number(
                        order.total_items
                    );
            }
        }
    );


    // ========================================================
    // DELIVERED ORDERS
    // ========================================================

    const deliveredOrders =
        deliveredOrderIds.size;


    // ========================================================
    // DELIVERYMAN EARNINGS
    //
    // ONLY successfully delivered orders earn 1,500 RWF.
    // ========================================================

    const earnings =
        deliveredOrders *
        DELIVERYMAN_RATE;


    // ========================================================
    // ACTIVE DELIVERYMEN
    //
    // Active means:
    // assigned
    // started
    // on_the_way
    // ========================================================

    const activeDeliverymen =
        new Set();

    allDeliveries.forEach(
        function (delivery) {

            if (
                delivery.deliveryman_id &&
                [
                    "assigned",
                    "started",
                    "on_the_way"
                ].includes(
                    delivery.delivery_status
                )
            ) {

                activeDeliverymen.add(
                    Number(
                        delivery.deliveryman_id
                    )
                );
            }
        }
    );


    // ========================================================
    // UPDATE REPORT CARDS
    // ========================================================

    setText(
        "reportDeliveredOrders",
        deliveredOrders
    );

    setText(
        "reportDeliveredProducts",
        productsDelivered
    );

    setText(
        "reportDeliverymanEarnings",
        formatMoney(earnings)
    );

    setText(
        "reportActiveDeliverymen",
        activeDeliverymen.size
    );


    // ========================================================
    // UPDATE DELIVERYMAN REPORT TABLE
    // ========================================================

    displayDeliverymanReportTable(
        delivered
    );
}


// ============================================================
// DELIVERYMAN REPORT TABLE
// ============================================================

function displayDeliverymanReportTable(
    delivered
) {

    const table =
        document.getElementById(
            "deliverymanReportTable"
        );

    if (!table) {
        return;
    }

    if (!allDeliverymen.length) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    No deliverymen found.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML =
        allDeliverymen.map(
            function (person) {

                // ---------------------------------------------
                // Get this deliveryman's delivered deliveries
                // ---------------------------------------------

                const deliveries =
                    delivered.filter(
                        function (delivery) {

                            return Number(
                                delivery.deliveryman_id
                            ) === Number(person.id);

                        }
                    );


                // ---------------------------------------------
                // Unique delivered orders
                // ---------------------------------------------

                const orderIds =
                    new Set(
                        deliveries.map(
                            function (delivery) {

                                return Number(
                                    delivery.order_id
                                );

                            }
                        )
                    );


                const ordersDelivered =
                    orderIds.size;


                // ---------------------------------------------
                // Products delivered
                // ---------------------------------------------

                let productsDelivered = 0;


                deliveries.forEach(
                    function (delivery) {

                        const order =
                            allOrders.find(
                                function (item) {

                                    return Number(item.id) ===
                                        Number(delivery.order_id);

                                }
                            );


                        if (!order) {
                            return;
                        }


                        if (
                            Array.isArray(order.items)
                        ) {

                            productsDelivered +=
                                order.items.reduce(
                                    function (
                                        total,
                                        item
                                    ) {

                                        return total +
                                            Number(
                                                item.quantity || 0
                                            );

                                    },
                                    0
                                );

                        } else if (
                            order.product_count !==
                            undefined &&
                            order.product_count !==
                            null
                        ) {

                            productsDelivered +=
                                Number(
                                    order.product_count
                                );

                        } else if (
                            order.total_items !==
                            undefined &&
                            order.total_items !==
                            null
                        ) {

                            productsDelivered +=
                                Number(
                                    order.total_items
                                );
                        }
                    }
                );


                // ---------------------------------------------
                // Earnings
                // ---------------------------------------------

                const earnings =
                    ordersDelivered *
                    DELIVERYMAN_RATE;


                // ---------------------------------------------
                // Display row
                // ---------------------------------------------

                return `
                    <tr>

                        <td>
                            ${escapeHtml(
                                `${person.first_name || ""} ${person.last_name || ""}`
                                    .trim()
                            )}
                        </td>

                        <td>
                            ${ordersDelivered}
                        </td>

                        <td>
                            ${productsDelivered}
                        </td>

                        <td>
                            ${formatMoney(
                                DELIVERYMAN_RATE
                            )}
                        </td>

                        <td>
                            ${formatMoney(
                                earnings
                            )}
                        </td>

                    </tr>
                `;
            }
        ).join("");
}


// ============================================================
// SEARCH AND FILTERS
// ============================================================

function setupSearchAndFilters() {

    const productSearch =
        document.getElementById(
            "productSearch"
        );

    const productCategory =
        document.getElementById(
            "productCategoryFilter"
        );

    const orderSearch =
        document.getElementById(
            "orderSearch"
        );

    const orderStatus =
        document.getElementById(
            "orderStatusFilter"
        );

    const customerSearch =
        document.getElementById(
            "customerSearch"
        );

    if (productSearch) {

        productSearch.addEventListener(
            "input",
            filterProducts
        );
    }

    if (productCategory) {

        productCategory.addEventListener(
            "change",
            filterProducts
        );
    }

    if (orderSearch) {

        orderSearch.addEventListener(
            "input",
            filterOrders
        );
    }

    if (orderStatus) {

        orderStatus.addEventListener(
            "change",
            filterOrders
        );
    }

    if (customerSearch) {

        customerSearch.addEventListener(
            "input",
            filterCustomers
        );
    }
}


function filterProducts() {

    const search =
        document.getElementById(
            "productSearch"
        )?.value
            .toLowerCase()
            .trim() || "";

    const category =
        document.getElementById(
            "productCategoryFilter"
        )?.value || "";

    const filtered =
        allProducts.filter(
            function (product) {

                const text =
                    `${product.name || ""} ${product.brand || ""} ${product.category || ""}`
                        .toLowerCase();

                return (
                    text.includes(search) &&
                    (
                        !category ||
                        product.category ===
                        category
                    )
                );
            }
        );

    renderProductRows(filtered);
}


function renderProductRows(products) {

    const table =
        document.getElementById(
            "productsTable"
        );

    if (!table) {
        return;
    }

    if (!products.length) {

        table.innerHTML = `
            <tr>
                <td colspan="8">
                    No matching products.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        products.map(
            function (product) {

                return `
                    <tr>

                        <td>${escapeHtml(product.id)}</td>

                        <td>
                            ${
                                product.image_url ||
                                product.image
                                    ? `
                                        <img
                                            src="${escapeAttribute(
                                                product.image_url ||
                                                product.image
                                            )}"
                                            alt="Product"
                                            style="
                                                width:50px;
                                                height:50px;
                                                object-fit:cover;
                                                border-radius:8px;
                                            "
                                        >
                                      `
                                    : "—"
                            }
                        </td>

                        <td>${escapeHtml(product.name || "-")}</td>

                        <td>${escapeHtml(product.brand || "-")}</td>

                        <td>${escapeHtml(product.category || "-")}</td>

                        <td>${formatMoney(product.price)}</td>

                        <td>
                            ${escapeHtml(
                                product.stock_quantity ??
                                product.stock ??
                                0
                            )}
                        </td>

                        <td>

                            <button
                                class="btn btn-secondary"
                                onclick="editProduct(${Number(product.id)})">
                                Edit
                            </button>

                            <button
                                class="btn btn-danger"
                                onclick="deleteProduct(${Number(product.id)})">
                                Delete
                            </button>

                        </td>

                    </tr>
                `;
            }
        ).join("");
}


function filterOrders() {

    const search =
        document.getElementById(
            "orderSearch"
        )?.value
            .toLowerCase()
            .trim() || "";

    const status =
        document.getElementById(
            "orderStatusFilter"
        )?.value || "";

    const filtered =
        allOrders.filter(
            function (order) {

                const customer =
                    getOrderCustomerName(order)
                        .toLowerCase();

                const id =
                    String(order.id);

                const orderStatus =
                    order.order_status ||
                    order.status ||
                    "";

                return (
                    (
                        id.includes(search) ||
                        customer.includes(search)
                    ) &&
                    (
                        !status ||
                        orderStatus === status
                    )
                );
            }
        );

    renderOrderRows(filtered);
}


function renderOrderRows(orders) {

    const table =
        document.getElementById(
            "ordersTable"
        );

    if (!table) {
        return;
    }

    if (!orders.length) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    No matching orders.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        orders.map(
            function (order) {

                const delivery =
                    getDeliveryForOrder(
                        order.id
                    );

                return `
                    <tr>

                        <td>
                            #${escapeHtml(order.id)}
                        </td>

                        <td>
                            ${escapeHtml(
                                getOrderCustomerName(order)
                            )}
                        </td>

                        <td>
                            ${formatMoney(
                                order.total_amount ??
                                order.total ??
                                0
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                getOrderPaymentStatus(order)
                            )}
                        </td>

                        <td>
                            ${formatStatus(
                                order.order_status ||
                                order.status
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                getDeliverymanName(
                                    delivery?.deliveryman_id
                                ) ||
                                "Not assigned"
                            )}
                        </td>

                        <td>

                            <button
                                class="btn btn-primary"
                                onclick="openAssignDelivery(${Number(order.id)})">
                                Assign
                            </button>

                        </td>

                    </tr>
                `;
            }
        ).join("");
}


function filterCustomers() {

    const search =
        document.getElementById(
            "customerSearch"
        )?.value
            .toLowerCase()
            .trim() || "";

    const filtered =
        allCustomers.filter(
            function (customer) {

                const name =
                    `${customer.first_name || ""} ${customer.last_name || ""}`
                        .toLowerCase();

                const email =
                    (
                        customer.email ||
                        ""
                    ).toLowerCase();

                const phone =
                    String(
                        customer.phone ||
                        ""
                    ).toLowerCase();

                return (
                    name.includes(search) ||
                    email.includes(search) ||
                    phone.includes(search)
                );
            }
        );

    renderCustomerRows(filtered);
}


function renderCustomerRows(customers) {

    const table =
        document.getElementById(
            "customersTable"
        );

    if (!table) {
        return;
    }

    if (!customers.length) {

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    No matching customers.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        customers.map(
            function (customer) {

                const name =
                    `${customer.first_name || ""} ${customer.last_name || ""}`
                        .trim();

                return `
                    <tr>

                        <td>${escapeHtml(customer.id)}</td>

                        <td>${escapeHtml(name || "Customer")}</td>

                        <td>${escapeHtml(customer.email || "-")}</td>

                        <td>${escapeHtml(customer.phone || "-")}</td>

                        <td>
                            ${escapeHtml(
                                customer.order_count ??
                                customer.orders_count ??
                                customer.orders ??
                                0
                            )}
                        </td>

                        <td>
                            ${formatDate(customer.created_at)}
                        </td>

                    </tr>
                `;
            }
        ).join("");
}


// ============================================================
// DASHBOARD REFRESH
// ============================================================

function setupDashboardRefresh() {

    const button =
        document.getElementById(
            "dashboardRefresh"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        async function () {

            try {

                button.disabled = true;

                await loadAllAdminData();

                showToast(
                    "Dashboard refreshed successfully.",
                    "success"
                );

            } catch (error) {

                console.error(
                    "Dashboard refresh error:",
                    error
                );

                showToast(
                    error.message ||
                    "Unable to refresh dashboard.",
                    "error"
                );

            } finally {

                button.disabled = false;
            }
        }
    );
}


// ============================================================
// GLOBAL MODAL EVENTS
// ============================================================

function setupGlobalModalEvents() {

    document.addEventListener(
        "click",
        function (event) {

            if (
                event.target.classList.contains(
                    "modal"
                )
            ) {

                event.target.classList.add(
                    "hidden"
                );
            }

        }
    );
}


// ============================================================
// DELIVERYMAN DELETE / EDIT
// ============================================================

function editDeliveryman(id) {

    const person =
        allDeliverymen.find(
            function (item) {

                return Number(item.id) ===
                    Number(id);

            }
        );

    if (!person) {
        return;
    }

    const firstName =
        prompt(
            "First name:",
            person.first_name || ""
        );

    if (firstName === null) {
        return;
    }

    const lastName =
        prompt(
            "Last name:",
            person.last_name || ""
        );

    if (lastName === null) {
        return;
    }

    const phone =
        prompt(
            "Phone:",
            person.phone || ""
        );

    if (phone === null) {
        return;
    }

    updateDeliveryman(
        id,
        firstName,
        lastName,
        phone
    );
}


window.editDeliveryman =
    editDeliveryman;


async function updateDeliveryman(
    id,
    firstName,
    lastName,
    phone
) {

    try {

        await apiRequest(
            `/users/deliverymen/${id}`,
            {
                method: "PUT",

                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone
                })
            }
        );

        showToast(
            "Deliveryman updated successfully.",
            "success"
        );

        await loadDeliverymen();

    } catch (error) {

        console.error(
            "Update deliveryman error:",
            error
        );

        showToast(
            error.message ||
            "Unable to update deliveryman.",
            "error"
        );
    }
}


async function deleteDeliveryman(id) {

    if (
        !confirm(
            "Are you sure you want to delete this deliveryman?"
        )
    ) {

        return;
    }

    try {

        await apiRequest(
            `/users/deliverymen/${id}`,
            {
                method: "DELETE"
            }
        );

        showToast(
            "Deliveryman deleted successfully.",
            "success"
        );

        await loadDeliverymen();

    } catch (error) {

        console.error(
            "Delete deliveryman error:",
            error
        );

        showToast(
            error.message ||
            "Unable to delete deliveryman.",
            "error"
        );
    }
}


window.deleteDeliveryman =
    deleteDeliveryman;


// ============================================================
// TOAST
// ============================================================

function showToast(
    message,
    type = "info"
) {

    let container =
        document.getElementById(
            "toastContainer"
        );

    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "toastContainer";

        container.style.position =
            "fixed";

        container.style.top =
            "20px";

        container.style.right =
            "20px";

        container.style.zIndex =
            "99999";

        document.body.appendChild(
            container
        );
    }

    const toast =
        document.createElement(
            "div"
        );

    toast.textContent =
        message;

    toast.style.padding =
        "12px 18px";

    toast.style.marginBottom =
        "10px";

    toast.style.borderRadius =
        "8px";

    toast.style.background =
        "#222";

    toast.style.color =
        "#fff";

    toast.style.boxShadow =
        "0 4px 12px rgba(0,0,0,0.2)";

    toast.style.maxWidth =
        "350px";

    container.appendChild(
        toast
    );

    setTimeout(
        function () {

            toast.remove();

        },
        3500
    );
}


// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;
    }
}


function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.value =
            value;
    }
}


function formatMoney(value) {

    const amount =
        Number(value || 0);

    return (
        amount.toLocaleString(
            "en-RW"
        ) +
        " RWF"
    );
}


function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);
    }

    return date.toLocaleString(
        "en-RW",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function formatStatus(status) {

    if (!status) {
        return "Unknown";
    }

    return String(status)
        .replaceAll("_", " ")
        .replace(
            /\b\w/g,
            function (letter) {

                return letter.toUpperCase();

            }
        );
}


function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {

    return escapeHtml(value);
}


// ============================================================
// INITIAL DISPLAY HELPERS
// ============================================================

function renderAllAdminData() {

    displayProducts();

    displayOrders();

    displayCustomers();

    displayDeliverymen();

    displayTracking();

    displayPayments();

    updateDashboardStatistics();

    updateReports();
}