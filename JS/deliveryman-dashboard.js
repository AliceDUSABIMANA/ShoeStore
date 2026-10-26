 /* ==================================================
   SHOE STORE - DELIVERYMAN DASHBOARD
================================================== */

const API_URL = "http://127.0.0.1:5000/api";

let currentUser = null;
let deliveries = [];
let selectedDelivery = null;

let watchId = null;

let currentLatitude = null;
let currentLongitude = null;

let lastSentLatitude = null;
let lastSentLongitude = null;

let locationSending = false;
let loadingDeliveries = false;


/* ==================================================
   PAGE LOAD
================================================== */

document.addEventListener("DOMContentLoaded", function () {
    checkDeliverymanAccess();
});


/* ==================================================
   DELIVERYMAN ACCESS
================================================== */

function checkDeliverymanAccess() {

    const savedUser = localStorage.getItem("shoeStoreUser");

    if (!savedUser) {

        alert("Please login first.");

        window.location.href = "login.html";

        return;
    }

    try {

        currentUser = JSON.parse(savedUser);

    } catch (error) {

        console.error("Invalid login information:", error);

        localStorage.removeItem("shoeStoreUser");

        window.location.href = "login.html";

        return;
    }

    if (
        !currentUser ||
        currentUser.role !== "deliveryman" ||
        !currentUser.id
    ) {

        alert("Access denied. Deliveryman account required.");

        localStorage.removeItem("shoeStoreUser");

        window.location.href = "login.html";

        return;
    }

    currentUser.id = Number(currentUser.id);

    if (
        !Number.isInteger(currentUser.id) ||
        currentUser.id <= 0
    ) {

        alert("Invalid deliveryman account ID.");

        localStorage.removeItem("shoeStoreUser");

        window.location.href = "login.html";

        return;
    }

    initializeDashboard();
}


/* ==================================================
   INITIALIZE
================================================== */

function initializeDashboard() {

    showDeliverymanInformation();

    setupNavigation();

    setupButtons();

    showSection("dashboard");

    loadDeliveries();
}


/* ==================================================
   INFORMATION
================================================== */

function showDeliverymanInformation() {

    const firstName = currentUser.first_name || "";
    const lastName = currentUser.last_name || "";

    const fullName = `${firstName} ${lastName}`.trim();

    const displayName =
        fullName ||
        currentUser.email ||
        "Deliveryman";

    setText(
        "deliverymanName",
        displayName
    );

    setText(
        "profileName",
        displayName
    );

    setText(
        "profileEmail",
        currentUser.email || "—"
    );

    setText(
        "profileFirstName",
        currentUser.first_name || "—"
    );

    setText(
        "profileLastName",
        currentUser.last_name || "—"
    );

    setText(
        "profileEmailRow",
        currentUser.email || "—"
    );

    setText(
        "profilePhone",
        currentUser.phone || "—"
    );
}


/* ==================================================
   NAVIGATION
================================================== */

function setupNavigation() {

    document
        .querySelectorAll("[data-section]")
        .forEach(function (button) {

            /*
             * The sidebar already uses
             * openDeliverymanSection().
             *
             * Do not add another listener to buttons
             * that already have an onclick handler.
             */

            if (
                button.hasAttribute("onclick")
            ) {
                return;
            }

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    const section =
                        this.getAttribute("data-section");

                    if (!section) {
                        return;
                    }

                    showSection(section);

                    if (
                        section === "deliveries" ||
                        section === "dashboard"
                    ) {
                        loadDeliveries();
                    }
                }
            );
        });
}


/* ==================================================
   COMPATIBILITY NAVIGATION
================================================== */

function openDeliverymanSection(sectionId) {

    if (!sectionId) {
        return;
    }

    showSection(sectionId);

    if (
        sectionId === "deliveries" ||
        sectionId === "dashboard"
    ) {
        loadDeliveries();
    }
}


/* ==================================================
   SHOW SECTION
================================================== */

function showSection(sectionId) {

    document
        .querySelectorAll(
            ".dashboard-section, .page-section, .content-section"
        )
        .forEach(function (section) {

            section.classList.add("hidden");

            section.classList.remove("active");
        });

    const selectedSection =
        document.getElementById(sectionId);

    if (!selectedSection) {

        console.error(
            "Section not found:",
            sectionId
        );

        return;
    }

    selectedSection.classList.remove("hidden");

    selectedSection.classList.add("active");

    document
        .querySelectorAll(
            ".menu-btn, .nav-item, [data-section]"
        )
        .forEach(function (button) {

            button.classList.remove("active");

            if (
                button.getAttribute("data-section") ===
                sectionId
            ) {

                button.classList.add("active");
            }
        });

    updatePageHeader(sectionId);

    if (sectionId === "tracking") {
        updateTrackingScreen();
    }

    if (
        sectionId === "delivery-details" &&
        selectedDelivery
    ) {

        showDeliveryDetails(
            selectedDelivery
        );
    }
}


/* ==================================================
   HEADER
================================================== */

function updatePageHeader(sectionId) {

    const pageTitle =
        document.getElementById("pageTitle");

    const pageDescription =
        document.getElementById("pageDescription");

    const information = {

        dashboard: {
            title: "Deliveryman Dashboard",
            description:
                "Manage your deliveries and delivery activity"
        },

        deliveries: {
            title: "My Deliveries",
            description:
                "View and manage deliveries assigned to you"
        },

        "delivery-details": {
            title: "Delivery Details",
            description:
                "View information about your selected delivery"
        },

        tracking: {
            title: "Map / Tracking",
            description:
                "Share your current delivery location"
        },

        history: {
            title: "Delivery History",
            description:
                "View your completed deliveries"
        },

        profile: {
            title: "My Profile",
            description:
                "View your deliveryman account information"
        }
    };

    const data = information[sectionId];

    if (!data) {
        return;
    }

    if (pageTitle) {
        pageTitle.textContent = data.title;
    }

    if (pageDescription) {
        pageDescription.textContent = data.description;
    }
}


/* ==================================================
   BUTTONS
================================================== */

function setupButtons() {

    const logoutBtn =
        document.getElementById("logoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            logout
        );
    }

    const refreshButton =
        document.getElementById("refreshButton");

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadDeliveries
        );
    }

    const dashboardRefresh =
        document.getElementById("dashboardRefresh");

    if (dashboardRefresh) {

        dashboardRefresh.addEventListener(
            "click",
            loadDeliveries
        );
    }

    const locationButton =
        document.getElementById("locationButton");

    if (locationButton) {

        locationButton.addEventListener(
            "click",
            startLocationSharing
        );
    }

    const stopLocationButton =
        document.getElementById("stopLocationButton");

    if (stopLocationButton) {

        stopLocationButton.addEventListener(
            "click",
            stopLocationSharing
        );
    }

    const googleMapsButton =
        document.getElementById("openGoogleMapsBtn");

    if (googleMapsButton) {

        googleMapsButton.addEventListener(
            "click",
            openGoogleMaps
        );

        googleMapsButton.disabled = true;
    }
}


/* ==================================================
   LOGOUT
================================================== */

function logout() {

    if (
        !confirm(
            "Are you sure you want to logout?"
        )
    ) {
        return;
    }

    stopLocationSharing();

    localStorage.removeItem(
        "shoeStoreUser"
    );

    window.location.href =
        "login.html";
}


/* ==================================================
   LOAD DELIVERIES
================================================== */

async function loadDeliveries() {

    /*
     * Prevent multiple simultaneous requests.
     */

    if (loadingDeliveries) {
        return;
    }

    loadingDeliveries = true;

    showLoading();

    if (
        !currentUser ||
        !currentUser.id
    ) {

        loadingDeliveries = false;

        displayDeliveriesError(
            "Deliveryman account ID is missing."
        );

        return;
    }

    const deliverymanId =
        Number(currentUser.id);

    if (
        !Number.isInteger(deliverymanId) ||
        deliverymanId <= 0
    ) {

        loadingDeliveries = false;

        displayDeliveriesError(
            "Invalid deliveryman account ID."
        );

        return;
    }

    try {

        const requestURL =
            `${API_URL}/deliveries/deliveryman/${deliverymanId}`;

        const response =
            await fetch(
                requestURL,
                {
                    method: "GET",

                    headers: {
                        "Accept": "application/json"
                    },

                    cache: "no-store"
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data?.message ||
                `Server returned HTTP ${response.status}`
            );
        }

        let loadedDeliveries = [];

        if (
            Array.isArray(data.deliveries)
        ) {

            loadedDeliveries =
                data.deliveries;

        } else if (
            Array.isArray(data)
        ) {

            loadedDeliveries =
                data;
        }

        /*
         * Normalize the API data.
         */

        deliveries =
            loadedDeliveries.map(
                function (delivery) {

                    return {

                        ...delivery,

                        id:
                            Number(delivery.id),

                        order_id:
                            Number(delivery.order_id),

                        deliveryman_id:
                            Number(
                                delivery.deliveryman_id
                            ),

                        delivery_status:
                            String(
                                delivery.delivery_status ||
                                "assigned"
                            )
                                .trim()
                                .toLowerCase()
                    };
                }
            );

        /*
         * Newest delivery first.
         */

        deliveries.sort(
            function (a, b) {

                return (
                    Number(b.id || 0) -
                    Number(a.id || 0)
                );
            }
        );

        /*
         * Display data.
         */

        updateSummary();

        displayDashboardDeliveries();

        displayDeliveries();

        displayHistory();

        /*
         * Keep selected delivery if it still exists.
         */

        if (selectedDelivery) {

            const refreshedSelected =
                deliveries.find(
                    function (delivery) {

                        return (
                            Number(delivery.id) ===
                            Number(
                                selectedDelivery.id
                            )
                        );
                    }
                );

            if (refreshedSelected) {

                selectedDelivery =
                    refreshedSelected;

            } else {

                selectedDelivery =
                    null;
            }
        }

        /*
         * Select an active delivery automatically.
         */

        if (!selectedDelivery) {

            const activeDelivery =
                getActiveDelivery();

            if (activeDelivery) {

                selectedDelivery =
                    activeDelivery;
            }
        }

        /*
         * Visible diagnostic.
         * This appears only in the browser tab description
         * and does not change your dashboard design.
         */

        const pageDescription =
            document.getElementById(
                "pageDescription"
            );

        if (
            pageDescription &&
            document.getElementById("deliveries")
                ?.classList.contains("active")
        ) {

            pageDescription.textContent =
                `You have ${deliveries.length} delivery record(s), ` +
                `${getActiveDeliveries().length} active.`;
        }

    } catch (error) {

        console.error(
            "Delivery loading error:",
            error
        );

        deliveries = [];

        updateSummary();

        displayDashboardDeliveries();

        displayDeliveriesError(
            error.message ||
            "Unable to load deliveries."
        );

        displayHistory();

    } finally {

        loadingDeliveries = false;
    }
}


/* ==================================================
   GET ACTIVE DELIVERIES
================================================== */

function getActiveDeliveries() {

    return deliveries.filter(
        function (delivery) {

            const status =
                String(
                    delivery.delivery_status || ""
                )
                    .trim()
                    .toLowerCase();

            return (
                status !== "delivered" &&
                status !== "cancelled"
            );
        }
    );
}


/* ==================================================
   LOADING
================================================== */

function showLoading() {

    const list =
        document.getElementById(
            "deliveriesList"
        );

    if (list) {

        list.innerHTML =
            '<div class="loading">Loading deliveries...</div>';
    }

    const dashboard =
        document.getElementById(
            "dashboardDeliveries"
        );

    if (dashboard) {

        dashboard.innerHTML =
            '<div class="loading">Loading deliveries...</div>';
    }
}


/* ==================================================
   DASHBOARD
================================================== */

function displayDashboardDeliveries() {

    const container =
        document.getElementById(
            "dashboardDeliveries"
        );

    if (!container) {
        return;
    }

    const active =
        getActiveDeliveries();

    if (active.length === 0) {

        container.innerHTML =
            '<div class="empty-message">No active deliveries.</div>';

        return;
    }

    container.innerHTML = "";

    active
        .slice(0, 4)
        .forEach(
            function (delivery) {

                const item =
                    document.createElement("div");

                item.className =
                    "mini-delivery";

                item.innerHTML = `

                    <div>

                        <h3>
                            Order #${escapeHTML(
                                delivery.order_id || "—"
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                delivery.delivery_address ||
                                "Address not available"
                            )}
                        </p>

                    </div>

                    <span class="delivery-status status-${escapeHTML(
                        delivery.delivery_status || "assigned"
                    )}">
                        ${formatStatus(
                            delivery.delivery_status || "assigned"
                        )}
                    </span>

                `;

                item.addEventListener(
                    "click",
                    function () {

                        selectedDelivery =
                            delivery;

                        showDeliveryDetails(
                            delivery
                        );

                        showSection(
                            "delivery-details"
                        );
                    }
                );

                container.appendChild(item);
            }
        );
}


/* ==================================================
   ALL DELIVERIES
================================================== */

function displayDeliveries() {

    const container =
        document.getElementById(
            "deliveriesList"
        );

    if (!container) {
        return;
    }

    const active =
        getActiveDeliveries();

    if (active.length === 0) {

        container.innerHTML = `

            <div class="empty-message">

                <h3>No active deliveries</h3>

                <p>
                    New deliveries assigned to you
                    will appear here.
                </p>

            </div>

        `;

        return;
    }

    container.innerHTML = "";

    active.forEach(
        function (delivery) {

            const card =
                document.createElement("div");

            card.className =
                "delivery-card";

            const status =
                String(
                    delivery.delivery_status ||
                    "assigned"
                )
                    .trim()
                    .toLowerCase();

            const total =
                delivery.total_amount !== null &&
                delivery.total_amount !== undefined
                    ? Number(
                        delivery.total_amount
                    ).toLocaleString() +
                      " RWF"
                    : "—";

            card.innerHTML = `

                <div class="delivery-header">

                    <div>

                        <h3>
                            Order #${escapeHTML(
                                delivery.order_id || "—"
                            )}
                        </h3>

                        <p class="delivery-id">
                            Delivery ID:
                            ${escapeHTML(
                                delivery.id || "—"
                            )}
                        </p>

                    </div>

                    <span class="delivery-status status-${escapeHTML(status)}">
                        ${formatStatus(status)}
                    </span>

                </div>


                <div class="delivery-info-grid">

                    <div class="detail-box">

                        <span>Customer</span>

                        <strong>
                            ${escapeHTML(
                                delivery.customer_name ||
                                "Customer"
                            )}
                        </strong>

                    </div>


                    <div class="detail-box">

                        <span>Phone</span>

                        <strong>
                            ${escapeHTML(
                                delivery.customer_phone ||
                                "Not available"
                            )}
                        </strong>

                    </div>


                    <div class="detail-box">

                        <span>Delivery Address</span>

                        <strong>
                            ${escapeHTML(
                                delivery.delivery_address ||
                                "Address not available"
                            )}
                        </strong>

                    </div>


                    <div class="detail-box">

                        <span>Order Amount</span>

                        <strong>
                            ${total}
                        </strong>

                    </div>

                </div>


                <div class="delivery-actions">

                    <button
                        type="button"
                        class="secondary-btn view-details">
                        View Details
                    </button>

                    ${getActionButton(delivery)}

                </div>

            `;

            container.appendChild(card);

            attachDeliveryActions(
                card,
                delivery
            );
        }
    );
}


/* ==================================================
   ACTION BUTTON
================================================== */

function getActionButton(delivery) {

    const status =
        String(
            delivery.delivery_status ||
            "assigned"
        )
            .trim()
            .toLowerCase();

    if (status === "assigned") {

        return `
            <button
                type="button"
                class="primary-btn start-delivery">
                🚚 Start Delivery
            </button>
        `;
    }

    if (status === "started") {

        return `
            <button
                type="button"
                class="primary-btn on-way">
                🛵 On The Way
            </button>
        `;
    }

    if (status === "on_the_way") {

        return `
            <button
                type="button"
                class="primary-btn mark-delivered">
                📦 Mark as Delivered
            </button>
        `;
    }

    return "";
}


/* ==================================================
   ACTION EVENTS
================================================== */

function attachDeliveryActions(
    card,
    delivery
) {

    const details =
        card.querySelector(".view-details");

    if (details) {

        details.addEventListener(
            "click",
            function () {

                selectedDelivery =
                    delivery;

                showDeliveryDetails(
                    delivery
                );

                showSection(
                    "delivery-details"
                );
            }
        );
    }

    const start =
        card.querySelector(".start-delivery");

    if (start) {

        start.addEventListener(
            "click",
            async function () {

                selectedDelivery =
                    delivery;

                start.disabled = true;

                start.textContent =
                    "Starting...";

                const success =
                    await updateDeliveryStatus(
                        delivery.id,
                        "started"
                    );

                if (!success) {

                    start.disabled =
                        false;

                    start.textContent =
                        "🚚 Start Delivery";
                }
            }
        );
    }

    const onWay =
        card.querySelector(".on-way");

    if (onWay) {

        onWay.addEventListener(
            "click",
            async function () {

                selectedDelivery =
                    delivery;

                onWay.disabled =
                    true;

                onWay.textContent =
                    "Updating...";

                const success =
                    await updateDeliveryStatus(
                        delivery.id,
                        "on_the_way"
                    );

                if (success) {

                    showSection(
                        "tracking"
                    );

                } else {

                    onWay.disabled =
                        false;

                    onWay.textContent =
                        "🛵 On The Way";
                }
            }
        );
    }

    const delivered =
        card.querySelector(".mark-delivered");

    if (delivered) {

        delivered.addEventListener(
            "click",
            async function () {

                if (
                    !confirm(
                        "Confirm that this order has been delivered?"
                    )
                ) {
                    return;
                }

                selectedDelivery =
                    delivery;

                delivered.disabled =
                    true;

                delivered.textContent =
                    "Updating...";

                const success =
                    await updateDeliveryStatus(
                        delivery.id,
                        "delivered"
                    );

                if (success) {

                    stopLocationSharing();

                } else {

                    delivered.disabled =
                        false;

                    delivered.textContent =
                        "📦 Mark as Delivered";
                }
            }
        );
    }
}


/* ==================================================
   DETAILS
================================================== */

function showDeliveryDetails(delivery) {

    selectedDelivery =
        delivery;

    const container =
        document.getElementById(
            "deliveryDetailsCard"
        );

    if (!container) {
        return;
    }

    const status =
        String(
            delivery.delivery_status ||
            "assigned"
        )
            .trim()
            .toLowerCase();

    const amount =
        delivery.total_amount !== null &&
        delivery.total_amount !== undefined
            ? Number(
                delivery.total_amount
            ).toLocaleString() +
              " RWF"
            : "—";

    container.innerHTML = `

        <div class="details-card">

            <div class="details-card-header">

                <div>

                    <h3>
                        Order #${escapeHTML(
                            delivery.order_id || "—"
                        )}
                    </h3>

                    <p>
                        Delivery ID:
                        ${escapeHTML(
                            delivery.id || "—"
                        )}
                    </p>

                </div>

                <span class="delivery-status status-${escapeHTML(status)}">
                    ${formatStatus(status)}
                </span>

            </div>


            <div class="details-grid">

                <div class="details-item">

                    <span>Customer</span>

                    <strong>
                        ${escapeHTML(
                            delivery.customer_name ||
                            "Customer"
                        )}
                    </strong>

                </div>


                <div class="details-item">

                    <span>Phone</span>

                    <strong>
                        ${escapeHTML(
                            delivery.customer_phone ||
                            "Not available"
                        )}
                    </strong>

                </div>


                <div class="details-item">

                    <span>Delivery Address</span>

                    <strong>
                        ${escapeHTML(
                            delivery.delivery_address ||
                            "Not available"
                        )}
                    </strong>

                </div>


                <div class="details-item">

                    <span>Order Amount</span>

                    <strong>
                        ${amount}
                    </strong>

                </div>


                <div class="details-item">

                    <span>Delivery Status</span>

                    <strong>
                        ${formatStatus(status)}
                    </strong>

                </div>


                <div class="details-item">

                    <span>Order Date</span>

                    <strong>
                        ${formatDate(
                            delivery.created_at
                        )}
                    </strong>

                </div>

            </div>

        </div>

    `;
}


/* ==================================================
   UPDATE STATUS
================================================== */

async function updateDeliveryStatus(
    deliveryId,
    status
) {

    try {

        const response =
            await fetch(
                `${API_URL}/deliveries/${deliveryId}/status`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        status,

                        deliveryman_id:
                            Number(
                                currentUser.id
                            )
                    })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to update delivery."
            );
        }

        await loadDeliveries();

        const updated =
            deliveries.find(
                function (item) {

                    return (
                        Number(item.id) ===
                        Number(deliveryId)
                    );
                }
            );

        if (updated) {

            selectedDelivery =
                updated;
        }

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


/* ==================================================
   SUMMARY
================================================== */

function updateSummary() {

    let assigned = 0;
    let onTheWay = 0;
    let delivered = 0;

    deliveries.forEach(
        function (delivery) {

            const status =
                String(
                    delivery.delivery_status ||
                    "assigned"
                )
                    .trim()
                    .toLowerCase();

            if (
                status === "assigned" ||
                status === "started"
            ) {

                assigned++;
            }

            if (
                status === "on_the_way"
            ) {

                onTheWay++;
            }

            if (
                status === "delivered"
            ) {

                delivered++;
            }
        }
    );

    setText(
        "assignedCount",
        assigned
    );

    setText(
        "onTheWayCount",
        onTheWay
    );

    setText(
        "deliveredCount",
        delivered
    );
}


/* ==================================================
   HISTORY
================================================== */

function displayHistory() {

    const container =
        document.getElementById(
            "historyList"
        );

    if (!container) {
        return;
    }

    const completed =
        deliveries.filter(
            function (delivery) {

                const status =
                    String(
                        delivery.delivery_status || ""
                    )
                        .trim()
                        .toLowerCase();

                return (
                    status === "delivered" ||
                    status === "cancelled"
                );
            }
        );

    if (completed.length === 0) {

        container.innerHTML = `

            <div class="empty-message">

                <h3>No delivery history</h3>

                <p>
                    Completed deliveries will appear here.
                </p>

            </div>

        `;

        return;
    }

    container.innerHTML = "";

    completed.forEach(
        function (delivery) {

            const card =
                document.createElement("div");

            card.className =
                "history-card";

            card.innerHTML = `

                <div>

                    <h3>
                        Order #${escapeHTML(
                            delivery.order_id || "—"
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            delivery.delivery_address ||
                            "Address not available"
                        )}
                    </p>

                </div>


                <div>

                    <span class="history-date">

                        ${formatStatus(
                            delivery.delivery_status
                        )}:

                        ${formatDate(
                            delivery.delivered_at ||
                            delivery.created_at
                        )}

                    </span>

                </div>

            `;

            container.appendChild(card);
        }
    );
}


/* ==================================================
   START GPS
================================================== */

function startLocationSharing() {

    if (!navigator.geolocation) {

        alert(
            "This browser does not support GPS location services."
        );

        return;
    }

    const activeDelivery =
        getActiveDelivery();

    if (!activeDelivery) {

        alert(
            "Please click Start Delivery first."
        );

        return;
    }

    selectedDelivery =
        activeDelivery;

    if (watchId !== null) {

        updateLocationMessage(
            "Location Sharing Active",
            "Your GPS location is already being shared."
        );

        return;
    }

    currentLatitude = null;
    currentLongitude = null;

    lastSentLatitude = null;
    lastSentLongitude = null;

    const locationButton =
        document.getElementById(
            "locationButton"
        );

    if (locationButton) {

        locationButton.disabled = true;

        locationButton.textContent =
            "📍 Getting Location...";
    }

    updateLocationMessage(
        "Requesting GPS Location",
        "Please click Allow when your browser asks for your location."
    );

    setText(
        "gpsSummary",
        "Connecting..."
    );

    try {

        watchId =
            navigator.geolocation.watchPosition(
                handleLocation,
                handleLocationError,
                {
                    enableHighAccuracy: true,
                    maximumAge: 5000,
                    timeout: 30000
                }
            );

    } catch (error) {

        console.error(
            "GPS start error:",
            error
        );

        watchId = null;

        handleLocationError({
            code: 2,
            message: error.message
        });
    }
}


/* ==================================================
   GPS SUCCESS
================================================== */

function handleLocation(position) {

    const latitude =
        Number(
            position.coords.latitude
        );

    const longitude =
        Number(
            position.coords.longitude
        );

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        return;
    }

    currentLatitude =
        latitude;

    currentLongitude =
        longitude;

    setText(
        "latitude",
        latitude.toFixed(6)
    );

    setText(
        "longitude",
        longitude.toFixed(6)
    );

    setText(
        "gpsSummary",
        "Online"
    );

    updateLocationMessage(
        "Location Sharing Active",
        "Your current GPS location is being shared with the server."
    );

    const indicator =
        document.getElementById(
            "locationIndicator"
        );

    if (indicator) {

        indicator.classList.add("active");
    }

    const locationButton =
        document.getElementById(
            "locationButton"
        );

    if (locationButton) {

        locationButton.classList.add("hidden");
    }

    const stopButton =
        document.getElementById(
            "stopLocationButton"
        );

    if (stopButton) {

        stopButton.classList.remove("hidden");
    }

    const activeDelivery =
        getActiveDelivery();

    if (activeDelivery) {

        selectedDelivery =
            activeDelivery;

        const changed =
            lastSentLatitude === null ||
            lastSentLongitude === null ||
            Math.abs(
                latitude -
                lastSentLatitude
            ) > 0.00001 ||
            Math.abs(
                longitude -
                lastSentLongitude
            ) > 0.00001;

        if (
            changed &&
            !locationSending
        ) {

            sendLocationToServer(
                activeDelivery.id,
                latitude,
                longitude
            );
        }
    }

    updateMapLink(
        latitude,
        longitude
    );

    setText(
        "mapMessage",
        `Current GPS position: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    );
}


/* ==================================================
   SEND LOCATION
================================================== */

async function sendLocationToServer(
    deliveryId,
    latitude,
    longitude
) {

    if (locationSending) {
        return;
    }

    locationSending = true;

    try {

        const response =
            await fetch(
                `${API_URL}/deliveries/${deliveryId}/location`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        deliveryman_id:
                            Number(
                                currentUser.id
                            ),

                        latitude,

                        longitude
                    })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            console.error(
                "Location API error:",
                data
            );

            return;
        }

        lastSentLatitude =
            latitude;

        lastSentLongitude =
            longitude;

    } catch (error) {

        console.error(
            "GPS server error:",
            error
        );

    } finally {

        locationSending =
            false;
    }
}


/* ==================================================
   GPS ERROR
================================================== */

function handleLocationError(error) {

    console.error(
        "GPS ERROR:",
        error
    );

    watchId = null;

    const locationButton =
        document.getElementById(
            "locationButton"
        );

    if (locationButton) {

        locationButton.disabled =
            false;

        locationButton.classList.remove(
            "hidden"
        );

        locationButton.textContent =
            "📍 Start Location Sharing";
    }

    const stopButton =
        document.getElementById(
            "stopLocationButton"
        );

    if (stopButton) {

        stopButton.classList.add(
            "hidden"
        );
    }

    setText(
        "gpsSummary",
        "Offline"
    );

    let message =
        "Unable to get your current location.";

    if (error.code === 1) {

        message =
            "Location permission was denied. Allow location access in your browser.";

    } else if (error.code === 2) {

        message =
            "Your device could not determine your location. Make sure Windows Location Services are enabled.";

    } else if (error.code === 3) {

        message =
            "GPS took too long to respond. Try again.";
    }

    updateLocationMessage(
        "Unable to Get Location",
        message
    );

    alert(message);
}


/* ==================================================
   STOP GPS
================================================== */

function stopLocationSharing() {

    if (watchId !== null) {

        navigator.geolocation.clearWatch(
            watchId
        );

        watchId = null;
    }

    locationSending = false;

    const locationButton =
        document.getElementById(
            "locationButton"
        );

    if (locationButton) {

        locationButton.disabled =
            false;

        locationButton.classList.remove(
            "hidden"
        );

        locationButton.textContent =
            "📍 Start Location Sharing";
    }

    const stopButton =
        document.getElementById(
            "stopLocationButton"
        );

    if (stopButton) {

        stopButton.classList.add(
            "hidden"
        );
    }

    const indicator =
        document.getElementById(
            "locationIndicator"
        );

    if (indicator) {

        indicator.classList.remove(
            "active"
        );
    }

    setText(
        "gpsSummary",
        "Offline"
    );

    updateLocationMessage(
        "Location Not Started",
        "Click Start Location Sharing to share your current GPS location."
    );
}


/* ==================================================
   ACTIVE DELIVERY
================================================== */

function getActiveDelivery() {

    if (
        selectedDelivery &&
        (
            String(
                selectedDelivery.delivery_status
            ).toLowerCase() === "started" ||

            String(
                selectedDelivery.delivery_status
            ).toLowerCase() === "on_the_way"
        )
    ) {

        return selectedDelivery;
    }

    return (
        deliveries.find(
            function (delivery) {

                const status =
                    String(
                        delivery.delivery_status || ""
                    )
                        .trim()
                        .toLowerCase();

                return (
                    status === "started" ||
                    status === "on_the_way"
                );
            }
        ) ||
        null
    );
}


/* ==================================================
   TRACKING SCREEN
================================================== */

function updateTrackingScreen() {

    const activeDelivery =
        getActiveDelivery();

    if (!activeDelivery) {

        updateLocationMessage(
            "No Active Delivery",
            "Go to My Deliveries and click Start Delivery first."
        );

        setText(
            "gpsSummary",
            "Offline"
        );

        setText(
            "latitude",
            "—"
        );

        setText(
            "longitude",
            "—"
        );

        return;
    }

    selectedDelivery =
        activeDelivery;

    const trackingInfo =
        document.getElementById(
            "trackingDeliveryInfo"
        );

    if (trackingInfo) {

        trackingInfo.classList.remove(
            "hidden"
        );
    }

    setText(
        "trackingDeliveryText",
        `Order #${activeDelivery.order_id || "—"} • ${
            activeDelivery.delivery_address ||
            "Address not available"
        }`
    );

    if (watchId === null) {

        updateLocationMessage(
            "Ready to Track",
            "Click Start Location Sharing and allow location access."
        );

        setText(
            "gpsSummary",
            "Offline"
        );
    }
}


/* ==================================================
   MAP LINK
================================================== */

function updateMapLink(
    latitude,
    longitude
) {

    const button =
        document.getElementById(
            "openGoogleMapsBtn"
        );

    if (!button) {
        return;
    }

    if (
        !Number.isFinite(
            Number(latitude)
        ) ||
        !Number.isFinite(
            Number(longitude)
        )
    ) {

        return;
    }

    button.dataset.latitude =
        String(latitude);

    button.dataset.longitude =
        String(longitude);

    button.disabled = false;
}


/* ==================================================
   OPEN GOOGLE MAPS
================================================== */

function openGoogleMaps() {

    const button =
        document.getElementById(
            "openGoogleMapsBtn"
        );

    let latitude =
        currentLatitude;

    let longitude =
        currentLongitude;

    if (
        (
            latitude === null ||
            longitude === null
        ) &&
        button
    ) {

        latitude =
            Number(
                button.dataset.latitude
            );

        longitude =
            Number(
                button.dataset.longitude
            );
    }

    if (
        !Number.isFinite(
            Number(latitude)
        ) ||
        !Number.isFinite(
            Number(longitude)
        )
    ) {

        alert(
            "GPS coordinates are not available yet."
        );

        return;
    }

    const url =
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    window.open(
        url,
        "_blank"
    );
}


/* ==================================================
   LOCATION MESSAGE
================================================== */

function updateLocationMessage(
    statusText,
    messageText
) {

    setText(
        "locationStatus",
        statusText
    );

    setText(
        "locationMessage",
        messageText
    );
}


/* ==================================================
   ERROR
================================================== */

function displayDeliveriesError(message) {

    const container =
        document.getElementById(
            "deliveriesList"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `

        <div class="error-message">

            <h3>
                Unable to load deliveries
            </h3>

            <p>
                ${escapeHTML(
                    message ||
                    "Unknown error"
                )}
            </p>

            <button
                type="button"
                class="secondary-btn"
                onclick="loadDeliveries()">

                🔄 Try Again

            </button>

        </div>

    `;
}


/* ==================================================
   STATUS
================================================== */

function formatStatus(status) {

    return String(
        status || ""
    )
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            function (letter) {

                return letter.toUpperCase();
            }
        );
}


/* ==================================================
   DATE
================================================== */

function formatDate(date) {

    if (!date) {
        return "—";
    }

    const parsed =
        new Date(date);

    if (
        isNaN(
            parsed.getTime()
        )
    ) {

        return "—";
    }

    return parsed.toLocaleString();
}


/* ==================================================
   ESCAPE HTML
================================================== */

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* ==================================================
   SET TEXT
================================================== */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );

    if (element) {

        element.textContent =
            value;
    }
}