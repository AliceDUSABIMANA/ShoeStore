 // =====================================================
// SHOE STORE - CUSTOMER DASHBOARD
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const API_URL = "http://127.0.0.1:5000/api";


    // =====================================================
    // HELPER FUNCTIONS
    // =====================================================

    function getElement(id) {
        return document.getElementById(id);
    }


    function setText(id, value) {

        const element = getElement(id);

        if (element) {
            element.textContent = value;
        }

    }


    function formatMoney(value) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "0";
        }

        return number.toLocaleString("en-RW");
    }


    function formatDate(value) {

        if (!value) {
            return "-";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleDateString("en-RW", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });

    }


    function formatStatus(value) {

        return String(value || "pending")
            .replace(/_/g, " ")
            .replace(/\b\w/g, function (letter) {
                return letter.toUpperCase();
            });

    }


    function formatPaymentMethod(value) {

        const method =
            String(value || "").toLowerCase();

        if (method === "mobile_money") {
            return "Mobile Money";
        }

        if (method === "cash") {
            return "Cash on Delivery";
        }

        return formatStatus(method || "unknown");

    }


    function escapeHTML(value) {

        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // =====================================================
    // LOGIN / CUSTOMER CHECK
    // =====================================================

    const storedUser =
        localStorage.getItem("shoeStoreUser");


    if (!storedUser) {

        window.location.href = "login.html";

        return;
    }


    let user;


    try {

        user = JSON.parse(storedUser);

    } catch (error) {

        console.error(
            "Invalid shoeStoreUser:",
            error
        );

        localStorage.removeItem("shoeStoreUser");

        window.location.href = "login.html";

        return;
    }


    if (!user || user.role !== "customer") {

        localStorage.removeItem("shoeStoreUser");

        window.location.href = "login.html";

        return;
    }


    // =====================================================
    // CUSTOMER INFORMATION
    // =====================================================

    function getCustomerId() {

        return (
            user.id ||
            user.user_id ||
            user.customer_id
        );

    }


    const customerId = getCustomerId();


    if (!customerId) {

        console.error(
            "Customer ID was not found."
        );

        alert(
            "Customer information is missing. Please log in again."
        );

        localStorage.removeItem("shoeStoreUser");

        window.location.href = "login.html";

        return;
    }


    const fullName = (
        (user.first_name || "") +
        " " +
        (user.last_name || "")
    ).trim();


    const displayName =
        fullName ||
        user.name ||
        user.email ||
        "Customer";


    setText("customerName", displayName);

    setText("profileName", displayName);

    setText(
        "profileEmail",
        user.email || "Email not available"
    );

    setText(
        "profilePhone",
        user.phone || "Phone not available"
    );


    // =====================================================
    // NAVIGATION
    // =====================================================

    const menuButtons =
        document.querySelectorAll(".menu-btn");


    const sectionButtons =
        document.querySelectorAll("[data-section]");


    const sections =
        document.querySelectorAll(
            ".dashboard-section, .page-section"
        );


    const pageTitle =
        getElement("pageTitle");


    const pageDescription =
        getElement("pageDescription");


    const logoutButton =
        getElement("logoutButton");


    const pageInfo = {

        dashboard: {
            title: "Customer Dashboard",
            description:
                "Welcome to your ShoeStore account"
        },

        shop: {
            title: "Shop / Products",
            description:
                "Browse available shoes and add them to your cart"
        },

        cart: {
            title: "Shopping Cart",
            description:
                "Review your selected products before checkout"
        },

        orders: {
            title: "My Orders",
            description:
                "View your order history and delivery status"
        },

        payments: {
            title: "Payments",
            description:
                "View your payment history and payment status"
        },

        tracking: {
            title: "Delivery Tracking",
            description:
                "Track your delivery and deliveryman location"
        },

        profile: {
            title: "My Profile",
            description:
                "View and manage your customer account"
        }

    };


    function showSection(sectionId) {

        sections.forEach(function (section) {

            section.classList.add("hidden");

        });


        const selectedSection =
            getElement(sectionId);


        if (selectedSection) {

            selectedSection.classList.remove("hidden");

        }


        menuButtons.forEach(function (button) {

            button.classList.remove("active");


            if (
                button.dataset.section ===
                sectionId
            ) {

                button.classList.add("active");

            }

        });


        if (pageInfo[sectionId]) {

            if (pageTitle) {
                pageTitle.textContent =
                    pageInfo[sectionId].title;
            }


            if (pageDescription) {
                pageDescription.textContent =
                    pageInfo[sectionId].description;
            }

        }


        if (sectionId === "shop") {
            loadProducts();
        }


        if (sectionId === "cart") {
            renderCart();
        }


        if (sectionId === "orders") {
            loadOrders();
        }


        if (sectionId === "payments") {
            loadPayments();
        }


        if (sectionId === "tracking") {
            loadTracking();
        }

    }


    sectionButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const section =
                    button.dataset.section;

                if (section) {
                    showSection(section);
                }

            }
        );

    });


    // =====================================================
    // LOGOUT
    // =====================================================

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function () {

                localStorage.removeItem(
                    "shoeStoreUser"
                );

                localStorage.removeItem(
                    "shoeStoreCart"
                );

                window.location.href =
                    "login.html";

            }
        );

    }


    // =====================================================
    // CART
    // =====================================================

    let cart = [];


    try {

        const savedCart =
            localStorage.getItem("shoeStoreCart");


        if (savedCart) {
            cart = JSON.parse(savedCart);
        }


        if (!Array.isArray(cart)) {
            cart = [];
        }

    } catch (error) {

        console.error(
            "Cart loading error:",
            error
        );

        cart = [];

    }


    function saveCart() {

        localStorage.setItem(
            "shoeStoreCart",
            JSON.stringify(cart)
        );

        updateCartCount();

    }


    function getCartItemCount() {

        return cart.reduce(
            function (total, item) {

                return (
                    total +
                    Number(item.quantity || 0)
                );

            },
            0
        );

    }


    function getCartTotal() {

        return cart.reduce(
            function (total, item) {

                const price =
                    Number(item.price || 0);

                const quantity =
                    Number(item.quantity || 0);

                return total + price * quantity;

            },
            0
        );

    }


    function updateCartCount() {

        const count =
            getCartItemCount();


        setText("cartCount", count);

        setText(
            "dashboardCartCount",
            count
        );

        setText(
            "shopCartCount",
            "(" + count + ")"
        );

        setText(
            "cartTotalItems",
            count
        );

    }


    // =====================================================
    // ADD TO CART
    // =====================================================

    function addToCart(product) {

        const productId =
            Number(product.id);


        const stock =
            Number(
                product.quantity ??
                product.stock ??
                0
            );


        if (!productId) {

            alert("Invalid product.");

            return;
        }


        if (stock <= 0) {

            alert(
                "This product is out of stock."
            );

            return;
        }


        const existing =
            cart.find(function (item) {

                return (
                    Number(item.id) ===
                    productId
                );

            });


        if (existing) {

            const currentQuantity =
                Number(existing.quantity || 0);


            const currentStock =
                Number(existing.stock || stock);


            if (
                currentQuantity >=
                currentStock
            ) {

                alert(
                    "You cannot add more than the available stock."
                );

                return;
            }


            existing.quantity =
                currentQuantity + 1;

        } else {

            cart.push({

                id: productId,

                name:
                    product.name ||
                    product.product_name ||
                    "Shoe",

                category:
                    product.category ||
                    "Shoe",

                price:
                    Number(product.price || 0),

                image:
                    product.image ||
                    product.image_url ||
                    "",

                stock: stock,

                quantity: 1

            });

        }


        saveCart();

        renderCart();


        alert(
            (product.name || "Product") +
            " was added to your cart."
        );

    }


    // =====================================================
    // RENDER CART
    // =====================================================

    function renderCart() {

        const cartItems =
            getElement("cartItems");


        if (!cartItems) {
            return;
        }


        updateCartCount();


        if (cart.length === 0) {

            cartItems.innerHTML = `

                <div class="empty-message">

                    <h3>
                        Your cart is empty.
                    </h3>

                    <p>
                        Browse our products and add
                        shoes to your shopping cart.
                    </p>

                </div>

            `;


            setText("cartTotal", "0 RWF");

            setText("cartTotalItems", "0");

            return;
        }


        cartItems.innerHTML = "";


        cart.forEach(function (item) {

            const price =
                Number(item.price || 0);


            const quantity =
                Number(item.quantity || 0);


            const itemTotal =
                price * quantity;


            const card =
                document.createElement("div");


            card.className =
                "cart-item";


            card.innerHTML = `

                <div class="cart-item-image">

                    ${
                        item.image
                            ? `
                                <img
                                    src="${escapeHTML(item.image)}"
                                    alt="${escapeHTML(item.name)}"
                                >
                              `
                            :
                            "👟"
                    }

                </div>


                <div class="cart-item-details">

                    <h3>
                        ${escapeHTML(item.name)}
                    </h3>

                    <p>
                        ${escapeHTML(
                            item.category || "Shoe"
                        )}
                    </p>

                    <strong>
                        ${formatMoney(price)} RWF
                    </strong>

                </div>


                <div class="cart-quantity">

                    <button
                        type="button"
                        class="quantity-btn"
                        data-action="decrease"
                        data-id="${item.id}">
                        −
                    </button>

                    <span>
                        ${quantity}
                    </span>

                    <button
                        type="button"
                        class="quantity-btn"
                        data-action="increase"
                        data-id="${item.id}">
                        +
                    </button>

                </div>


                <div class="cart-item-total">

                    <strong>
                        ${formatMoney(itemTotal)} RWF
                    </strong>

                    <button
                        type="button"
                        class="remove-cart-btn"
                        data-action="remove"
                        data-id="${item.id}">
                        Remove
                    </button>

                </div>

            `;


            cartItems.appendChild(card);

        });


        setText(
            "cartTotal",
            formatMoney(getCartTotal()) +
            " RWF"
        );


        setText(
            "cartTotalItems",
            getCartItemCount()
        );

    }


    // =====================================================
    // CART BUTTONS
    // =====================================================

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (!button) {
                return;
            }


            const action =
                button.dataset.action;


            const productId =
                Number(button.dataset.id);


            const item =
                cart.find(function (cartItem) {

                    return (
                        Number(cartItem.id) ===
                        productId
                    );

                });


            if (!item) {
                return;
            }


            if (action === "increase") {

                const stock =
                    Number(item.stock || 0);


                const quantity =
                    Number(item.quantity || 0);


                if (quantity < stock) {

                    item.quantity =
                        quantity + 1;

                } else {

                    alert(
                        "You have reached the available stock."
                    );

                }

            }


            if (action === "decrease") {

                item.quantity =
                    Number(item.quantity || 0) - 1;


                if (item.quantity <= 0) {

                    cart = cart.filter(
                        function (cartItem) {

                            return (
                                Number(cartItem.id) !==
                                productId
                            );

                        }
                    );

                }

            }


            if (action === "remove") {

                cart = cart.filter(
                    function (cartItem) {

                        return (
                            Number(cartItem.id) !==
                            productId
                        );

                    }
                );

            }


            saveCart();

            renderCart();

        }
    );


    // =====================================================
    // PRODUCTS
    // =====================================================

    let allProducts = [];


    async function loadProducts() {

        const productList =
            getElement("productList");


        if (!productList) {
            return;
        }


        productList.innerHTML = `

            <div class="loading">
                Loading products...
            </div>

        `;


        try {

            const response =
                await fetch(
                    API_URL + "/products"
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load products."
                );

            }


            allProducts =
                Array.isArray(data.products)
                    ? data.products
                    : Array.isArray(data.data)
                        ? data.data
                        : Array.isArray(data)
                            ? data
                            : [];


            populateCategories();

            applyProductFilters();

        } catch (error) {

            console.error(
                "Product loading error:",
                error
            );


            productList.innerHTML = `

                <div class="empty-message">

                    <h3>
                        Unable to load products
                    </h3>

                    <p>
                        Make sure the ShoeStore backend
                        is running on port 5000.
                    </p>

                    <button
                        type="button"
                        class="primary-btn"
                        id="retryProducts">

                        Try Again

                    </button>

                </div>

            `;

        }

    }


    // =====================================================
    // PRODUCT CATEGORY FILTER
    // =====================================================

    const productCategoryFilter =
        getElement(
            "productCategoryFilter"
        );


    function populateCategories() {

        if (!productCategoryFilter) {
            return;
        }


        const currentValue =
            productCategoryFilter.value;


        const categories =
            [...new Set(
                allProducts
                    .map(function (product) {

                        return String(
                            product.category || ""
                        ).trim();

                    })
                    .filter(Boolean)
            )];


        productCategoryFilter.innerHTML = `

            <option value="">
                All Categories
            </option>

        `;


        categories
            .sort()
            .forEach(function (category) {

                const option =
                    document.createElement("option");


                option.value =
                    category;


                option.textContent =
                    category;


                productCategoryFilter.appendChild(
                    option
                );

            });


        if (categories.includes(currentValue)) {

            productCategoryFilter.value =
                currentValue;

        }

    }


    // =====================================================
    // PRODUCT SEARCH
    // =====================================================

    const productSearch =
        getElement("productSearch");


    function applyProductFilters() {

        const search =
            productSearch
                ? productSearch.value
                    .trim()
                    .toLowerCase()
                : "";


        const category =
            productCategoryFilter
                ? productCategoryFilter.value
                    .trim()
                    .toLowerCase()
                : "";


        const filtered =
            allProducts.filter(
                function (product) {

                    const name =
                        String(
                            product.name ||
                            product.product_name ||
                            ""
                        ).toLowerCase();


                    const brand =
                        String(
                            product.brand || ""
                        ).toLowerCase();


                    const productCategory =
                        String(
                            product.category || ""
                        ).toLowerCase();


                    const description =
                        String(
                            product.description || ""
                        ).toLowerCase();


                    const matchesSearch =
                        !search ||
                        name.includes(search) ||
                        brand.includes(search) ||
                        productCategory.includes(search) ||
                        description.includes(search);


                    const matchesCategory =
                        !category ||
                        productCategory === category;


                    return (
                        matchesSearch &&
                        matchesCategory
                    );

                }
            );


        renderProducts(filtered);

    }


    if (productSearch) {

        productSearch.addEventListener(
            "input",
            applyProductFilters
        );

    }


    if (productCategoryFilter) {

        productCategoryFilter.addEventListener(
            "change",
            applyProductFilters
        );

    }


    // =====================================================
    // RENDER PRODUCTS
    // =====================================================

    function renderProducts(products) {

        const productList =
            getElement("productList");


        if (!productList) {
            return;
        }


        if (!products.length) {

            productList.innerHTML = `

                <div class="empty-message">

                    <h3>
                        No products found.
                    </h3>

                    <p>
                        Try another search or category.
                    </p>

                </div>

            `;

            return;
        }


        productList.innerHTML = "";


        products.forEach(function (product) {

            const id =
                Number(product.id);


            const name =
                product.name ||
                product.product_name ||
                "Shoe";


            const category =
                product.category ||
                "Shoe";


            const brand =
                product.brand || "";


            const price =
                Number(product.price || 0);


            const stock =
                Number(
                    product.quantity ??
                    product.stock ??
                    0
                );


            const image =
                product.image ||
                product.image_url ||
                "";


            const description =
                product.description || "";


            const card =
                document.createElement("div");


            card.className =
                "product-card";


            card.innerHTML = `

                <div class="product-image">

                    ${
                        image
                            ? `
                                <img
                                    src="${escapeHTML(image)}"
                                    alt="${escapeHTML(name)}"
                                >
                              `
                            :
                            "👟"
                    }

                </div>


                <div class="product-info">

                    <h3>
                        ${escapeHTML(name)}
                    </h3>


                    ${
                        brand
                            ? `
                                <p class="product-brand">
                                    ${escapeHTML(brand)}
                                </p>
                              `
                            :
                            ""
                    }


                    <p>
                        ${escapeHTML(category)}
                    </p>


                    ${
                        description
                            ? `
                                <p class="product-description">
                                    ${escapeHTML(description)}
                                </p>
                              `
                            :
                            ""
                    }


                    <strong class="product-price">
                        ${formatMoney(price)} RWF
                    </strong>


                    <p class="product-stock">

                        ${
                            stock > 0
                                ? "Stock: " + stock
                                : "Out of stock"
                        }

                    </p>


                    <button
                        type="button"
                        class="primary-btn add-to-cart-btn"
                        data-product-id="${id}"
                        ${stock <= 0 ? "disabled" : ""}>

                        ${
                            stock > 0
                                ? "Add to Cart"
                                : "Out of Stock"
                        }

                    </button>

                </div>

            `;


            productList.appendChild(card);

        });

    }


    // =====================================================
    // ADD TO CART EVENT
    // =====================================================

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".add-to-cart-btn"
                );


            if (!button) {
                return;
            }


            const productId =
                Number(button.dataset.productId);


            const product =
                allProducts.find(
                    function (item) {

                        return (
                            Number(item.id) ===
                            productId
                        );

                    }
                );


            if (!product) {

                alert(
                    "Product could not be found."
                );

                return;
            }


            addToCart(product);

        }
    );


    // =====================================================
    // RETRY PRODUCTS
    // =====================================================

    document.addEventListener(
        "click",
        function (event) {

            if (
                event.target.id ===
                "retryProducts"
            ) {

                loadProducts();

            }

        }
    );


    // =====================================================
    // ORDERS
    // =====================================================

    let allOrders = [];


    async function loadOrders() {

        const ordersTable =
            getElement("ordersTable");


        if (!ordersTable) {
            return;
        }


        ordersTable.innerHTML = `

            <tr>

                <td colspan="6">
                    Loading your orders...
                </td>

            </tr>

        `;


        try {

            const response =
                await fetch(
                    API_URL +
                    "/orders/customer/" +
                    encodeURIComponent(customerId)
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load orders."
                );

            }


            allOrders =
                Array.isArray(data.orders)
                    ? data.orders
                    : Array.isArray(data.data)
                        ? data.data
                        : [];


            renderOrders(allOrders);

            updateOrderStatistics(allOrders);

            renderRecentOrders(allOrders);

        } catch (error) {

            console.error(
                "Order loading error:",
                error
            );


            allOrders = [];


            ordersTable.innerHTML = `

                <tr>

                    <td colspan="6">

                        Unable to load orders.

                        <br><br>

                        <button
                            type="button"
                            class="primary-btn"
                            id="retryOrders">

                            Try Again

                        </button>

                    </td>

                </tr>

            `;


            updateOrderStatistics([]);

            renderRecentOrders([]);

        }

    }


    // =====================================================
    // RENDER ORDERS
    // =====================================================

    function renderOrders(orders) {

        const ordersTable =
            getElement("ordersTable");


        if (!ordersTable) {
            return;
        }


        if (!orders.length) {

            ordersTable.innerHTML = `

                <tr>

                    <td colspan="6">
                        No orders available yet.
                    </td>

                </tr>

            `;

            return;
        }


        ordersTable.innerHTML = "";


        orders.forEach(function (order) {

            const status =
                String(
                    order.order_status ||
                    order.status ||
                    "pending"
                ).toLowerCase();


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    #${escapeHTML(order.id)}
                </td>


                <td>
                    ${formatMoney(
                        order.total_amount || 0
                    )} RWF
                </td>


                <td>
                    ${escapeHTML(
                        order.delivery_address ||
                        "Not provided"
                    )}
                </td>


                <td>

                    <span
                        class="status-badge status-${escapeHTML(status)}">

                        ${formatStatus(status)}

                    </span>

                </td>


                <td>
                    ${formatDate(order.created_at)}
                </td>


                <td>

                    <button
                        type="button"
                        class="small-btn order-details-btn"
                        data-order-id="${escapeHTML(order.id)}">

                        View Details

                    </button>

                </td>

            `;


            ordersTable.appendChild(row);

        });

    }


    // =====================================================
    // ORDER STATISTICS
    // =====================================================

    function updateOrderStatistics(orders) {

        const total =
            orders.length;


        const pending =
            orders.filter(function (order) {

                const status =
                    String(
                        order.order_status ||
                        order.status ||
                        ""
                    ).toLowerCase();


                return [
                    "pending",
                    "confirmed",
                    "assigned",
                    "started",
                    "on_the_way"
                ].includes(status);

            }).length;


        const delivered =
            orders.filter(function (order) {

                const status =
                    String(
                        order.order_status ||
                        order.status ||
                        ""
                    ).toLowerCase();


                return status === "delivered";

            }).length;


        setText("orderCount", total);

        setText("pendingCount", pending);

        setText("deliveredCount", delivered);

    }


    // =====================================================
    // RECENT ORDERS
    // =====================================================

    function renderRecentOrders(orders) {

        const table =
            getElement("recentOrdersTable");


        if (!table) {
            return;
        }


        const recent =
            orders
                .slice()
                .sort(function (a, b) {

                    return (
                        new Date(b.created_at) -
                        new Date(a.created_at)
                    );

                })
                .slice(0, 5);


        if (!recent.length) {

            table.innerHTML = `

                <tr>

                    <td colspan="3">
                        No orders available yet.
                    </td>

                </tr>

            `;

            return;
        }


        table.innerHTML = "";


        recent.forEach(function (order) {

            const status =
                String(
                    order.order_status ||
                    order.status ||
                    "pending"
                ).toLowerCase();


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    #${escapeHTML(order.id)}
                </td>


                <td>
                    ${formatMoney(
                        order.total_amount || 0
                    )} RWF
                </td>


                <td>

                    <span
                        class="status-badge status-${escapeHTML(status)}">

                        ${formatStatus(status)}

                    </span>

                </td>

            `;


            table.appendChild(row);

        });

    }


    // =====================================================
    // ORDER SEARCH / FILTER
    // =====================================================

    const orderSearch =
        getElement("orderSearch");


    const orderStatusFilter =
        getElement("orderStatusFilter");


    function filterOrders() {

        const search =
            orderSearch
                ? orderSearch.value
                    .trim()
                    .toLowerCase()
                : "";


        const status =
            orderStatusFilter
                ? orderStatusFilter.value.toLowerCase()
                : "";


        const filtered =
            allOrders.filter(
                function (order) {

                    const orderId =
                        String(
                            order.id || ""
                        ).toLowerCase();


                    const address =
                        String(
                            order.delivery_address ||
                            ""
                        ).toLowerCase();


                    const orderStatus =
                        String(
                            order.order_status ||
                            order.status ||
                            ""
                        ).toLowerCase();


                    return (
                        (!search ||
                            orderId.includes(search) ||
                            address.includes(search)) &&
                        (!status ||
                            orderStatus === status)
                    );

                }
            );


        renderOrders(filtered);

    }


    if (orderSearch) {

        orderSearch.addEventListener(
            "input",
            filterOrders
        );

    }


    if (orderStatusFilter) {

        orderStatusFilter.addEventListener(
            "change",
            filterOrders
        );

    }


    // =====================================================
    // ORDER DETAILS
    // =====================================================

    const orderDetailsModal =
        getElement("orderDetailsModal");


    const orderDetails =
        getElement("orderDetails");


    const closeOrderDetailsModal =
        getElement("closeOrderDetailsModal");


    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".order-details-btn"
                );


            if (!button) {
                return;
            }


            showOrderDetails(
                button.dataset.orderId
            );

        }
    );


    async function showOrderDetails(orderId) {

        if (!orderDetailsModal || !orderDetails) {
            return;
        }


        orderDetails.innerHTML =
            "Loading order details...";


        orderDetailsModal.classList.remove(
            "hidden"
        );


        try {

            const response =
                await fetch(
                    API_URL +
                    "/orders/" +
                    encodeURIComponent(orderId)
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load order details."
                );

            }


            const order =
                data.order ||
                data.data ||
                data;


            const items =
                Array.isArray(data.items)
                    ? data.items
                    : Array.isArray(order.items)
                        ? order.items
                        : [];


            const status =
                String(
                    order.order_status ||
                    order.status ||
                    "pending"
                ).toLowerCase();


            orderDetails.innerHTML = `

                <div class="order-detail-box">

                    <h3>
                        Order #${escapeHTML(order.id)}
                    </h3>


                    <p>

                        <strong>Status:</strong>

                        <span
                            class="status-badge status-${escapeHTML(status)}">

                            ${formatStatus(status)}

                        </span>

                    </p>


                    <p>

                        <strong>Total:</strong>

                        ${formatMoney(
                            order.total_amount || 0
                        )} RWF

                    </p>


                    <p>

                        <strong>Delivery Address:</strong>

                        ${escapeHTML(
                            order.delivery_address ||
                            "Not provided"
                        )}

                    </p>


                    <p>

                        <strong>Date:</strong>

                        ${formatDate(order.created_at)}

                    </p>


                    <hr>


                    <h4>
                        Products
                    </h4>


                    ${
                        items.length
                            ? `
                                <div class="order-items">

                                    ${items.map(function (item) {

                                        return `

                                            <div class="order-item">

                                                <span>
                                                    ${escapeHTML(
                                                        item.name ||
                                                        item.product_name ||
                                                        "Product"
                                                    )}
                                                </span>

                                                <strong>
                                                    × ${Number(
                                                        item.quantity || 0
                                                    )}
                                                </strong>

                                                <span>
                                                    ${formatMoney(
                                                        item.price || 0
                                                    )} RWF
                                                </span>

                                            </div>

                                        `;

                                    }).join("")}

                                </div>
                              `
                            :
                            `
                                <p>
                                    Product details are not available.
                                </p>
                            `
                    }

                </div>

            `;

        } catch (error) {

            console.error(
                "Order details error:",
                error
            );


            orderDetails.innerHTML = `

                <div class="empty-message">

                    Unable to load order details.

                </div>

            `;

        }

    }


    if (closeOrderDetailsModal) {

        closeOrderDetailsModal.addEventListener(
            "click",
            function () {

                if (orderDetailsModal) {

                    orderDetailsModal.classList.add(
                        "hidden"
                    );

                }

            }
        );

    }


    if (orderDetailsModal) {

        orderDetailsModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    orderDetailsModal
                ) {

                    orderDetailsModal.classList.add(
                        "hidden"
                    );

                }

            }
        );

    }


    // =====================================================
    // RETRY ORDERS
    // =====================================================

    document.addEventListener(
        "click",
        function (event) {

            if (
                event.target.id ===
                "retryOrders"
            ) {

                loadOrders();

            }

        }
    );


    // =====================================================
    // PAYMENTS
    // =====================================================

    async function loadPayments() {

        const paymentsTable =
            getElement("paymentsTable");


        if (!paymentsTable) {
            return;
        }


        paymentsTable.innerHTML = `

            <tr>

                <td colspan="6">
                    Loading payments...
                </td>

            </tr>

        `;


        try {

            const response =
                await fetch(
                    API_URL +
                    "/payments/customer/" +
                    encodeURIComponent(customerId)
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load payments."
                );

            }


            const payments =
                Array.isArray(data.payments)
                    ? data.payments
                    : Array.isArray(data.data)
                        ? data.data
                        : [];


            renderPayments(payments);

        } catch (error) {

            console.error(
                "Payment loading error:",
                error
            );


            paymentsTable.innerHTML = `

                <tr>

                    <td colspan="6">
                        No payment information available.
                    </td>

                </tr>

            `;


            setText("totalPayments", "0 RWF");

            setText("completedPayments", "0 RWF");

            setText("pendingPayments", "0 RWF");

        }

    }


    function renderPayments(payments) {

        const paymentsTable =
            getElement("paymentsTable");


        if (!paymentsTable) {
            return;
        }


        if (!payments.length) {

            paymentsTable.innerHTML = `

                <tr>

                    <td colspan="6">
                        No payments available yet.
                    </td>

                </tr>

            `;

        } else {

            paymentsTable.innerHTML = "";


            payments.forEach(function (payment) {

                const status =
                    String(
                        payment.status ||
                        payment.payment_status ||
                        "pending"
                    ).toLowerCase();


                const method =
                    payment.method ||
                    payment.payment_method ||
                    "";


                const row =
                    document.createElement("tr");


                row.innerHTML = `

                    <td>
                        #${escapeHTML(payment.id)}
                    </td>


                    <td>
                        #${escapeHTML(
                            payment.order_id || "-"
                        )}
                    </td>


                    <td>
                        ${formatMoney(
                            payment.amount || 0
                        )} RWF
                    </td>


                    <td>
                        ${escapeHTML(
                            formatPaymentMethod(method)
                        )}
                    </td>


                    <td>

                        <span
                            class="status-badge status-${escapeHTML(status)}">

                            ${formatStatus(status)}

                        </span>

                    </td>


                    <td>
                        ${formatDate(payment.created_at)}
                    </td>

                `;


                paymentsTable.appendChild(row);

            });

        }


        const total =
            payments.reduce(
                function (sum, payment) {

                    return (
                        sum +
                        Number(payment.amount || 0)
                    );

                },
                0
            );


        const completed =
            payments
                .filter(function (payment) {

                    return (
                        String(
                            payment.status ||
                            payment.payment_status ||
                            ""
                        ).toLowerCase() ===
                        "completed"
                    );

                })
                .reduce(function (sum, payment) {

                    return (
                        sum +
                        Number(payment.amount || 0)
                    );

                }, 0);


        const pending =
            payments
                .filter(function (payment) {

                    return [
                        "pending",
                        "processing"
                    ].includes(
                        String(
                            payment.status ||
                            payment.payment_status ||
                            ""
                        ).toLowerCase()
                    );

                })
                .reduce(function (sum, payment) {

                    return (
                        sum +
                        Number(payment.amount || 0)
                    );

                }, 0);


        setText(
            "totalPayments",
            formatMoney(total) + " RWF"
        );


        setText(
            "completedPayments",
            formatMoney(completed) + " RWF"
        );


        setText(
            "pendingPayments",
            formatMoney(pending) + " RWF"
        );

    }


    // =====================================================
    // CHECKOUT ELEMENTS
    // =====================================================

    const checkoutButton =
        getElement("checkoutButton");


    const checkoutModal =
        getElement("checkoutModal");


    const checkoutForm =
        getElement("checkoutForm");


    const closeCheckoutModal =
        getElement("closeCheckoutModal");


    const paymentMethod =
        getElement("paymentMethod");


    const mobileMoneyField =
        getElement("mobileMoneyField");


    const mobileMoneyPhone =
        getElement("mobileMoneyPhone");


    const currentLocationButton =
        getElement("useCurrentLocation");


    // =====================================================
    // FILL CUSTOMER INFORMATION
    // =====================================================

    function fillCheckoutCustomerInformation() {

        const customerName =
            getElement("checkoutCustomerName");


        const customerEmail =
            getElement("checkoutCustomerEmail");


        const customerPhone =
            getElement("checkoutCustomerPhone");


        if (customerName) {

            customerName.value =
                displayName;

        }


        if (customerEmail) {

            customerEmail.value =
                user.email || "";

        }


        if (customerPhone) {

            customerPhone.value =
                user.phone || "";

        }

    }


    // =====================================================
    // OPEN CHECKOUT
    // =====================================================

    function openCheckout() {

        if (!cart.length) {

            alert(
                "Your cart is empty. Please add a product first."
            );

            return;
        }


        const total =
            getCartTotal();


        if (!Number.isFinite(total) || total <= 0) {

            alert(
                "Your cart total is invalid."
            );

            return;
        }


        fillCheckoutCustomerInformation();


        const checkoutTotal =
            getElement("checkoutTotal");


        if (checkoutTotal) {

            checkoutTotal.textContent =
                formatMoney(total) +
                " RWF";

        }


        if (paymentMethod) {

            paymentMethod.value = "";

        }


        if (mobileMoneyField) {

            mobileMoneyField.classList.add(
                "hidden"
            );

        }


        if (mobileMoneyPhone) {

            mobileMoneyPhone.required = false;

            mobileMoneyPhone.value = "";

        }


        if (!checkoutModal) {

            alert(
                "Checkout window could not be opened."
            );

            return;
        }


        checkoutModal.classList.remove(
            "hidden"
        );


        checkoutModal.style.display =
            "flex";

    }


    // =====================================================
    // CHECKOUT BUTTON
    // =====================================================

    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                openCheckout();

            }
        );

    } else {

        console.error(
            "ERROR: checkoutButton was not found."
        );

    }


    // =====================================================
    // PAYMENT METHOD CHANGE
    // =====================================================

    if (paymentMethod) {

        paymentMethod.addEventListener(
            "change",
            function () {

                const selectedMethod =
                    paymentMethod.value;


                if (
                    selectedMethod ===
                    "mobile_money"
                ) {

                    if (mobileMoneyField) {

                        mobileMoneyField.classList.remove(
                            "hidden"
                        );

                    }


                    if (mobileMoneyPhone) {

                        mobileMoneyPhone.required =
                            true;

                    }

                } else {

                    if (mobileMoneyField) {

                        mobileMoneyField.classList.add(
                            "hidden"
                        );

                    }


                    if (mobileMoneyPhone) {

                        mobileMoneyPhone.required =
                            false;

                        mobileMoneyPhone.value =
                            "";

                    }

                }

            }
        );

    }


    // =====================================================
    // CURRENT GPS LOCATION
    // =====================================================

    function getCurrentLocation() {

        if (
            !navigator.geolocation
        ) {

            alert(
                "Geolocation is not supported by your browser."
            );

            return;
        }


        if (currentLocationButton) {

            currentLocationButton.disabled =
                true;

            currentLocationButton.textContent =
                "📍 Getting Location...";

        }


        navigator.geolocation.getCurrentPosition(

            function (position) {

                const latitude =
                    position.coords.latitude;


                const longitude =
                    position.coords.longitude;


                const latitudeElement =
                    getElement("deliveryLatitude");


                const longitudeElement =
                    getElement("deliveryLongitude");


                if (latitudeElement) {

                    latitudeElement.value =
                        latitude.toFixed(6);

                }


                if (longitudeElement) {

                    longitudeElement.value =
                        longitude.toFixed(6);

                }


                if (currentLocationButton) {

                    currentLocationButton.disabled =
                        false;

                    currentLocationButton.textContent =
                        "📍 Location Selected";

                }


                alert(
                    "Your current location has been added successfully."
                );

            },

            function (error) {

                console.error(
                    "Geolocation error:",
                    error
                );


                if (currentLocationButton) {

                    currentLocationButton.disabled =
                        false;

                    currentLocationButton.textContent =
                        "📍 Use My Current Location";

                }


                let message =
                    "Unable to get your current location.";


                if (error.code === 1) {

                    message =
                        "Location permission was denied. Please allow location access in your browser.";

                } else if (error.code === 2) {

                    message =
                        "Your current location could not be determined.";

                } else if (error.code === 3) {

                    message =
                        "Getting your location took too long. Please try again.";

                }


                alert(message);

            },

            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }

        );

    }


    if (currentLocationButton) {

        currentLocationButton.addEventListener(
            "click",
            getCurrentLocation
        );

    }


    // =====================================================
    // CLOSE CHECKOUT
    // =====================================================

    if (closeCheckoutModal) {

        closeCheckoutModal.addEventListener(
            "click",
            function () {

                if (checkoutModal) {

                    checkoutModal.classList.add(
                        "hidden"
                    );

                    checkoutModal.style.display =
                        "none";

                }

            }
        );

    }


    // =====================================================
    // CLOSE CHECKOUT OUTSIDE
    // =====================================================

    if (checkoutModal) {

        checkoutModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    checkoutModal
                ) {

                    checkoutModal.classList.add(
                        "hidden"
                    );

                    checkoutModal.style.display =
                        "none";

                }

            }
        );

    }


    // =====================================================
    // CHECKOUT SUBMIT
    // =====================================================

    if (checkoutForm) {

        checkoutForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                if (!cart.length) {

                    alert(
                        "Your cart is empty."
                    );

                    return;

                }


                const customerPhoneElement =
                    getElement(
                        "checkoutCustomerPhone"
                    );


                const deliveryAddressElement =
                    getElement(
                        "deliveryAddress"
                    );


                const deliveryLatitudeElement =
                    getElement(
                        "deliveryLatitude"
                    );


                const deliveryLongitudeElement =
                    getElement(
                        "deliveryLongitude"
                    );


                const paymentMethodElement =
                    getElement(
                        "paymentMethod"
                    );


                const mobileMoneyPhoneElement =
                    getElement(
                        "mobileMoneyPhone"
                    );


                const customerPhone =
                    customerPhoneElement
                        ? customerPhoneElement.value.trim()
                        : "";


                const deliveryAddress =
                    deliveryAddressElement
                        ? deliveryAddressElement.value.trim()
                        : "";


                const deliveryLatitude =
                    deliveryLatitudeElement
                        ? Number(
                            deliveryLatitudeElement.value
                        )
                        : NaN;


                const deliveryLongitude =
                    deliveryLongitudeElement
                        ? Number(
                            deliveryLongitudeElement.value
                        )
                        : NaN;


                const selectedPaymentMethod =
                    paymentMethodElement
                        ? paymentMethodElement.value
                        : "";


                const mobileMoneyPhone =
                    mobileMoneyPhoneElement
                        ? mobileMoneyPhoneElement.value.trim()
                        : "";


                const totalAmount =
                    getCartTotal();


                // -----------------------------------------
                // CUSTOMER PHONE
                // -----------------------------------------

                if (!customerPhone) {

                    alert(
                        "Please enter your phone number."
                    );

                    if (customerPhoneElement) {
                        customerPhoneElement.focus();
                    }

                    return;

                }


                // -----------------------------------------
                // DELIVERY ADDRESS
                // -----------------------------------------

                if (!deliveryAddress) {

                    alert(
                        "Please enter your delivery address."
                    );

                    if (deliveryAddressElement) {
                        deliveryAddressElement.focus();
                    }

                    return;

                }


                // -----------------------------------------
                // LOCATION
                // -----------------------------------------

                if (
                    !Number.isFinite(
                        deliveryLatitude
                    ) ||
                    !Number.isFinite(
                        deliveryLongitude
                    )
                ) {

                    alert(
                        "Please enter a valid delivery location or use 'Use My Current Location'."
                    );

                    return;

                }


                if (
                    deliveryLatitude < -90 ||
                    deliveryLatitude > 90
                ) {

                    alert(
                        "Latitude must be between -90 and 90."
                    );

                    return;

                }


                if (
                    deliveryLongitude < -180 ||
                    deliveryLongitude > 180
                ) {

                    alert(
                        "Longitude must be between -180 and 180."
                    );

                    return;

                }


                // -----------------------------------------
                // PAYMENT METHOD
                // -----------------------------------------

                if (!selectedPaymentMethod) {

                    alert(
                        "Please choose a payment method."
                    );

                    return;

                }


                // -----------------------------------------
                // MOBILE MONEY PHONE
                // -----------------------------------------

                if (
                    selectedPaymentMethod ===
                    "mobile_money" &&
                    !mobileMoneyPhone
                ) {

                    alert(
                        "Please enter the Mobile Money phone number."
                    );

                    if (mobileMoneyPhoneElement) {
                        mobileMoneyPhoneElement.focus();
                    }

                    return;

                }


                // -----------------------------------------
                // TOTAL
                // -----------------------------------------

                if (
                    !Number.isFinite(totalAmount) ||
                    totalAmount <= 0
                ) {

                    alert(
                        "Your cart total is invalid."
                    );

                    return;

                }


                // -----------------------------------------
                // SUBMIT BUTTON
                // -----------------------------------------

                const submitButton =
                    getElement(
                        "placeOrderButton"
                    );


                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "Processing...";

                }


                try {

                    // =====================================
                    // ORDER ITEMS
                    // =====================================

                    const orderItems =
                        cart.map(function (item) {

                            return {

                                product_id:
                                    Number(item.id),

                                quantity:
                                    Number(
                                        item.quantity || 1
                                    ),

                                price:
                                    Number(
                                        item.price || 0
                                    )

                            };

                        });


                    // =====================================
                    // CREATE ORDER
                    // =====================================

                    const orderResponse =
                        await fetch(
                            API_URL + "/orders",
                            {

                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({

                                        customer_id:
                                            Number(
                                                customerId
                                            ),

                                        total_amount:
                                            totalAmount,

                                        delivery_address:
                                            deliveryAddress,

                                        delivery_latitude:
                                            deliveryLatitude,

                                        delivery_longitude:
                                            deliveryLongitude,

                                        items:
                                            orderItems

                                    })

                            }
                        );


                    const orderData =
                        await orderResponse.json();


                    if (!orderResponse.ok) {

                        throw new Error(
                            orderData.message ||
                            "Unable to create your order."
                        );

                    }


                    const orderId =
                        orderData.orderId ||
                        orderData.order_id ||
                        orderData.id ||
                        (
                            orderData.order &&
                            orderData.order.id
                        );


                    if (!orderId) {

                        throw new Error(
                            "Order was created but the order ID was not returned."
                        );

                    }


                    // =====================================
                    // CREATE PAYMENT
                    // =====================================

                    const transactionReference =
                        "PAY-" +
                        Date.now();


                    const paymentBody = {

                        order_id:
                            Number(orderId),

                        customer_id:
                            Number(customerId),

                        amount:
                            totalAmount,

                        payment_method:
                            selectedPaymentMethod,

                        transaction_reference:
                            transactionReference

                    };


                    // Send Mobile Money phone when used.
                    if (
                        selectedPaymentMethod ===
                        "mobile_money"
                    ) {

                        paymentBody.mobile_money_phone =
                            mobileMoneyPhone;

                    }


                    const paymentResponse =
                        await fetch(
                            API_URL + "/payments",
                            {

                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        paymentBody
                                    )

                            }
                        );


                    const paymentData =
                        await paymentResponse.json();


                    if (!paymentResponse.ok) {

                        throw new Error(
                            paymentData.message ||
                            "Order was created, but payment could not be recorded."
                        );

                    }


                    // =====================================
                    // CLEAR CART
                    // =====================================

                    cart = [];

                    saveCart();

                    renderCart();


                    // =====================================
                    // CLOSE MODAL
                    // =====================================

                    if (checkoutModal) {

                        checkoutModal.classList.add(
                            "hidden"
                        );

                        checkoutModal.style.display =
                            "none";

                    }


                    checkoutForm.reset();


                    if (mobileMoneyField) {

                        mobileMoneyField.classList.add(
                            "hidden"
                        );

                    }


                    if (mobileMoneyPhone) {

                        mobileMoneyPhone.required =
                            false;

                    }


                    // =====================================
                    // SUCCESS
                    // =====================================

                    alert(

                        "Order #" +
                        orderId +
                        " was placed successfully!\n\n" +

                        "Payment method: " +
                        formatPaymentMethod(
                            selectedPaymentMethod
                        ) +

                        "\nAmount: " +
                        formatMoney(totalAmount) +
                        " RWF" +

                        "\n\nPayment status: Pending"

                    );


                    // =====================================
                    // REFRESH
                    // =====================================

                    await loadOrders();

                    await loadPayments();


                    showSection("orders");


                } catch (error) {

                    console.error(
                        "Checkout error:",
                        error
                    );


                    alert(
                        error.message ||
                        "Something went wrong during checkout."
                    );

                } finally {

                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "Send Information & Place Order";

                    }

                }

            }
        );

    }


    // =====================================================
    // DELIVERY TRACKING
    // =====================================================

    let trackingTimer = null;


    async function loadTracking() {

        const activeDeliveries =
            getElement("activeDeliveries");


        if (!activeDeliveries) {
            return;
        }


        activeDeliveries.innerHTML = `

            <div class="loading">
                Loading active deliveries...
            </div>

        `;


        try {

            const response =
                await fetch(
                    API_URL +
                    "/deliveries/customer/" +
                    encodeURIComponent(customerId)
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load deliveries."
                );

            }


            const deliveries =
                Array.isArray(data.deliveries)
                    ? data.deliveries
                    : Array.isArray(data.data)
                        ? data.data
                        : [];


            renderTracking(deliveries);


            startTrackingRefresh();

        } catch (error) {

            console.error(
                "Tracking loading error:",
                error
            );


            activeDeliveries.innerHTML = `

                <div class="empty-message">

                    <h3>
                        Delivery tracking unavailable
                    </h3>

                    <p>
                        There are no active deliveries
                        to display right now.
                    </p>

                </div>

            `;

            stopTrackingRefresh();

        }

    }


    // =====================================================
    // TRACKING AUTO REFRESH
    // =====================================================

    function startTrackingRefresh() {

        stopTrackingRefresh();


        trackingTimer =
            setInterval(
                async function () {

                    const trackingSection =
                        getElement("tracking");


                    if (
                        trackingSection &&
                        !trackingSection.classList.contains(
                            "hidden"
                        )
                    ) {

                        try {

                            const response =
                                await fetch(
                                    API_URL +
                                    "/deliveries/customer/" +
                                    encodeURIComponent(
                                        customerId
                                    )
                                );


                            const data =
                                await response.json();


                            if (!response.ok) {
                                return;
                            }


                            const deliveries =
                                Array.isArray(
                                    data.deliveries
                                )
                                    ? data.deliveries
                                    : Array.isArray(
                                        data.data
                                    )
                                        ? data.data
                                        : [];


                            renderTracking(
                                deliveries
                            );

                        } catch (error) {

                            console.error(
                                "Tracking refresh error:",
                                error
                            );

                        }

                    }

                },
                5000
            );

    }


    function stopTrackingRefresh() {

        if (trackingTimer) {

            clearInterval(trackingTimer);

            trackingTimer = null;

        }

    }


    // =====================================================
    // RENDER TRACKING
    // =====================================================

    function renderTracking(deliveries) {

        const activeDeliveries =
            getElement("activeDeliveries");


        if (!activeDeliveries) {
            return;
        }


        if (!deliveries.length) {

            activeDeliveries.innerHTML = `

                <div class="empty-message">

                    <h3>
                        No active deliveries
                    </h3>

                    <p>
                        Your delivery information
                        will appear here when an
                        order is assigned.
                    </p>

                </div>

            `;


            const map =
                getElement("deliveryMap");


            if (map) {

                map.innerHTML = `

                    <div class="map-placeholder">

                        <div class="map-icon">
                            📍
                        </div>

                        <h3>
                            No Delivery Location
                        </h3>

                        <p>
                            Your deliveryman's location
                            will appear here when your
                            delivery is active.
                        </p>

                    </div>

                `;

            }


            return;
        }


        activeDeliveries.innerHTML = "";


        let latestDelivery = null;


        deliveries.forEach(function (delivery) {

            const status =
                String(
                    delivery.delivery_status ||
                    delivery.status ||
                    "assigned"
                ).toLowerCase();


            /*
             * IMPORTANT:
             * The backend returns the deliveryman's
             * current location as:
             *
             * current_latitude
             * current_longitude
             *
             * Older data may use latitude/longitude.
             */

            const latitude =
                delivery.current_latitude != null
                    ? Number(
                        delivery.current_latitude
                    )
                    : delivery.latitude != null
                        ? Number(
                            delivery.latitude
                        )
                        : NaN;


            const longitude =
                delivery.current_longitude != null
                    ? Number(
                        delivery.current_longitude
                    )
                    : delivery.longitude != null
                        ? Number(
                            delivery.longitude
                        )
                        : NaN;


            if (
                Number.isFinite(latitude) &&
                Number.isFinite(longitude)
            ) {

                latestDelivery = {

                    ...delivery,

                    latitude:
                        latitude,

                    longitude:
                        longitude

                };

            }


            const item =
                document.createElement("div");


            item.className =
                "delivery-item";


            item.innerHTML = `

                <h4>

                    Order #
                    ${escapeHTML(
                        delivery.order_id || "-"
                    )}

                </h4>


                <p>

                    <strong>
                        Status:
                    </strong>

                    <span
                        class="status-badge status-${escapeHTML(status)}">

                        ${formatStatus(status)}

                    </span>

                </p>


                <p>

                    <strong>
                        Deliveryman:
                    </strong>

                    ${escapeHTML(
                        delivery.deliveryman_name ||
                        "Assigned deliveryman"
                    )}

                </p>


                ${
                    delivery.deliveryman_phone
                        ? `

                            <p>

                                <strong>
                                    Phone:
                                </strong>

                                ${escapeHTML(
                                    delivery.deliveryman_phone
                                )}

                            </p>

                          `
                        :
                        ""
                }


                ${
                    Number.isFinite(latitude) &&
                    Number.isFinite(longitude)
                        ? `

                            <p>

                                <strong>
                                    Current Location:
                                </strong>

                                ${latitude.toFixed(6)},
                                ${longitude.toFixed(6)}

                            </p>

                            ${
                                delivery.location_updated_at
                                    ? `
                                        <p>

                                            <strong>
                                                Last Updated:
                                            </strong>

                                            ${formatDate(
                                                delivery.location_updated_at
                                            )}

                                        </p>
                                      `
                                    :
                                    ""
                            }

                          `
                        :
                        `

                            <p>

                                <strong>
                                    Location:
                                </strong>

                                Waiting for deliveryman GPS location.

                            </p>

                          `
                }

            `;


            activeDeliveries.appendChild(item);

        });


        if (latestDelivery) {

            showMapLocation(
                latestDelivery.latitude,
                latestDelivery.longitude,
                latestDelivery
            );

        } else {

            showDestinationWaitingMap(
                deliveries[0]
            );

        }

    }


    // =====================================================
    // GOOGLE MAPS LOCATION
    // =====================================================

    function showMapLocation(
        latitude,
        longitude,
        delivery
    ) {

        const map =
            getElement("deliveryMap");


        if (!map) {
            return;
        }


        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {

            return;
        }


        const googleMapsURL =
            "https://www.google.com/maps?q=" +
            encodeURIComponent(
                latitude + "," + longitude
            );


        const embedURL =
            "https://www.google.com/maps?q=" +
            encodeURIComponent(
                latitude + "," + longitude
            ) +
            "&output=embed";


        map.innerHTML = `

            <iframe
                src="${embedURL}"
                width="100%"
                height="400"
                style="border:0;"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                title="Deliveryman Current Location">
            </iframe>


            <div style="
                background:white;
                padding:12px;
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:10px;
                flex-wrap:wrap;
            ">

                <span>

                    📍 Deliveryman:

                    ${escapeHTML(
                        delivery &&
                        delivery.deliveryman_name
                            ? delivery.deliveryman_name
                            : "Deliveryman"
                    )}

                    <br>

                    <small>

                        Current location:
                        ${latitude.toFixed(6)},
                        ${longitude.toFixed(6)}

                    </small>

                </span>


                <a
                    href="${googleMapsURL}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="primary-btn">

                    Open Google Maps

                </a>

            </div>

        `;

    }


    // =====================================================
    // DESTINATION / WAITING MAP
    // =====================================================

    function showDestinationWaitingMap(delivery) {

        const map =
            getElement("deliveryMap");


        if (!map) {
            return;
        }


        const latitude =
            delivery &&
            delivery.delivery_latitude != null
                ? Number(
                    delivery.delivery_latitude
                )
                : NaN;


        const longitude =
            delivery &&
            delivery.delivery_longitude != null
                ? Number(
                    delivery.delivery_longitude
                )
                : NaN;


        if (
            Number.isFinite(latitude) &&
            Number.isFinite(longitude)
        ) {

            const googleMapsURL =
                "https://www.google.com/maps?q=" +
                encodeURIComponent(
                    latitude + "," + longitude
                );


            const embedURL =
                "https://www.google.com/maps?q=" +
                encodeURIComponent(
                    latitude + "," + longitude
                ) +
                "&output=embed";


            map.innerHTML = `

                <iframe
                    src="${embedURL}"
                    width="100%"
                    height="400"
                    style="border:0;"
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                    title="Delivery Destination">
                </iframe>


                <div style="
                    background:white;
                    padding:12px;
                    text-align:center;
                ">

                    📍 Waiting for deliveryman GPS location.

                    <br>

                    <a
                        href="${googleMapsURL}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="small-btn">

                        Open Delivery Destination

                    </a>

                </div>

            `;

        } else {

            map.innerHTML = `

                <div class="map-placeholder">

                    <div class="map-icon">
                        📍
                    </div>

                    <h3>
                        Waiting for Deliveryman
                    </h3>

                    <p>
                        The map will show the deliveryman's
                        current location when the journey starts.
                    </p>

                </div>

            `;

        }

    }


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    updateCartCount();

    renderCart();

    loadProducts();

    loadOrders();

    loadPayments();


    console.log(
        "ShoeStore customer dashboard JavaScript loaded successfully."
    );

});