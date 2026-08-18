/* ==========================================================================
    1. CORE SYSTEM & STATE (ATTRACT MODE LOGIC)
    ========================================================================== */
const GST_RATE = 0.05;
let lastOrderNumber = parseInt(localStorage.getItem('anora_last_order')) || 1000;
let autoResetTimer = null;
let idleTimer = null;
let idleWarningTimer = null;
const IDLE_LIMIT = 90000; // 90 sec
const WARNING_LIMIT = 10000; // 10 sec to respond
const ATTRACT_RESET_DELAY = 10000; // 10 sec auto-return after order

let state = {
    currentScreen: "screen-welcome",
    screenHistory: [],
    activeCategory: "ALL",
    searchQuery: "",
    cart: {}, 
    orderType: null,
    tableNumber: null,
    paymentMethod: null,
    orderData: null
};

const menuData = [
    { id: "s1", name: "Truffle Chicken Burger", category: "SIGNATURE", price: 329, desc: "Crispy chicken, aged cheddar, truffle aioli & caramelized onions in a brioche bun.", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80", tag: "CHEF'S PICK" },
    { id: "s2", name: "Truffle Mushroom Pasta", category: "SIGNATURE", price: 389, desc: "Handmade fettuccine tossed in a rich truffle and wild mushroom cream sauce.", image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80", tag: "BESTSELLER" },
    { id: "s3", name: "Four Cheese Pizza", category: "SIGNATURE", price: 429, desc: "Mozzarella, gorgonzola, parmesan, and goat cheese on a sourdough crust.", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80" },
    { id: "s4", name: "Truffle Parmesan Fries", category: "SIGNATURE", price: 229, desc: "Crisp golden fries finished with parmesan, herbs and truffle oil.", image: "https://images.unsplash.com/photo-1576107222621-12f716ce0360?auto=format&fit=crop&w=800&q=80" },
    { id: "b1", name: "Crispy Chicken Burger", category: "BURGERS", price: 289, desc: "Classic crispy chicken patty with fresh lettuce and house mayo.", image: "https://images.unsplash.com/photo-1615719413546-198b25453f85?auto=format&fit=crop&w=800&q=80" },
    { id: "b2", name: "Smoked Paneer Burger", category: "BURGERS", price: 269, desc: "House-smoked paneer, crisp lettuce, and spicy chipotle mayo.", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80" },
    { id: "p1", name: "Arrabbiata Pasta", category: "PASTA", price: 299, desc: "Penne pasta in a spicy tomato and garlic sauce with fresh basil.", image: "https://images.unsplash.com/photo-1621996311210-2a132cebc0e5?auto=format&fit=crop&w=800&q=80" },
    { id: "pz1", name: "Margherita Pizza", category: "PIZZA", price: 299, desc: "San Marzano tomato sauce, fresh mozzarella, and basil.", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80" },
    { id: "c1", name: "Cappuccino", category: "COFFEE", price: 189, desc: "Rich espresso topped with deeply steamed milk foam.", image: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80" },
    { id: "c2", name: "Cafe Latte", category: "COFFEE", price: 199, desc: "Espresso with steamed milk and a light layer of foam.", image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80" },
    { id: "cc1", name: "Classic Iced Latte", category: "COLD COFFEE", price: 219, desc: "Our signature espresso poured over milk and ice.", image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80" },
    { id: "d1", name: "New York Cheesecake", category: "DESSERTS", price: 269, desc: "Classic baked vanilla cheesecake on a buttery graham crust.", image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80" },
    { id: "d2", name: "Chocolate Lava Cake", category: "DESSERTS", price: 229, desc: "Warm chocolate cake with a molten center.", image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=800&q=80", tag: "NEW" }
];

const categories = [
    { name: "ALL", icon: "layout-grid" },
    { name: "SIGNATURE", icon: "star" },
    { name: "BURGERS", icon: "circle-dot" },
    { name: "PASTA", icon: "utensils" },
    { name: "PIZZA", icon: "pie-chart" },
    { name: "COFFEE", icon: "coffee" },
    { name: "COLD COFFEE", icon: "cup-soda" },
    { name: "DESSERTS", icon: "cake" }
];

function init() {
    lucide.createIcons();
    const headerTemplate = document.getElementById('flow-header').innerHTML;
    ['header-order-type', 'header-table', 'header-review', 'header-payment', 'header-pay-flow'].forEach(id => {
        document.getElementById(id).innerHTML = headerTemplate;
    });
    renderCategoryRail();
    renderMenu();
    setupIdleMonitoring();
}

// --- ATTRACT MODE & SESSION LOGIC ---

function startOrderSession() {
    const attractScreen = document.getElementById('screen-welcome');
    attractScreen.classList.add('opacity-0');
    
    setTimeout(() => {
        clearSessionData();
        switchScreen('screen-menu');
        attractScreen.classList.remove('opacity-0'); 
    }, 500); 
}

function clearSessionData() {
    state.cart = {};
    state.orderType = null;
    state.tableNumber = null;
    state.paymentMethod = null;
    state.orderData = null;
    state.screenHistory = [];
    state.activeCategory = "ALL";
    state.searchQuery = "";
    document.getElementById('searchInput').value = "";
    
    localStorage.removeItem('anora_cart_v2'); 
    
    updateCartUI();
    renderCategoryRail();
    renderMenu();
}

function resetToAttractMode() {
    clearTimeout(autoResetTimer);
    clearTimeout(idleTimer);
    clearTimeout(idleWarningTimer);
    
    hideIdleWarning();
    closeModal();
    if(document.getElementById('cart-drawer').classList.contains('drawer-open')) toggleCartDrawer();
    
    // Yahan fix kiya hai ji papa: classes wapas add kar di hain taaki receipt puri tarah hide ho jaye
    const overlay = document.getElementById('receipt-overlay');
    const modal = document.getElementById('receipt-modal');
    if (overlay && modal) {
        overlay.classList.remove('opacity-100', 'pointer-events-auto');
        overlay.classList.add('opacity-0', 'pointer-events-none');
        modal.classList.remove('scale-100', 'opacity-100');
        modal.classList.add('scale-95', 'opacity-0');
    }
    
    clearSessionData();
    
    switchScreen('screen-welcome');
}

function confirmStartOver() {
    if(confirm("START OVER?\nYour current order will be cleared.")) {
        resetToAttractMode();
    }
}

/* ==========================================================================
    2. MENU RENDERING & INTERACTIONS
    ========================================================================== */
    
function imgFallback(img) {
    img.onerror = null; 
    img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'%3E%3Crect width='800' height='800' fill='%23E5D8C8'/%3E%3Ctext x='400' y='400' font-family='sans-serif' font-size='24' fill='%236F343B' text-anchor='middle' dominant-baseline='middle'%3EANORA%3C/text%3E%3C/svg%3E";
}

function renderCategoryRail() {
    const container = document.getElementById('category-list');
    container.innerHTML = categories.map(cat => `
        <button onclick="setCategory('${cat.name}')" class="cat-btn relative flex items-center gap-4 px-5 py-4 w-full text-left rounded-lg transition-colors text-charcoal hover:bg-white mb-1 ${state.activeCategory === cat.name ? 'active' : ''}">
            <div class="cat-active-indicator"></div>
            <i data-lucide="${cat.icon}" class="w-5 h-5 ${state.activeCategory === cat.name ? 'text-burgundy' : 'text-taupe'}"></i>
            <span class="text-sm tracking-wide">${cat.name}</span>
        </button>
    `).join('');
    lucide.createIcons();
}

function setCategory(cat) {
    state.activeCategory = cat;
    state.searchQuery = "";
    document.getElementById('searchInput').value = "";
    renderCategoryRail();
    renderMenu();
    document.getElementById('main-scroll').scrollTo(0,0);
}

function handleSearch() {
    state.searchQuery = document.getElementById('searchInput').value.toLowerCase();
    state.activeCategory = "ALL";
    renderCategoryRail();
    renderMenu();
}

function renderMenu() {
    const container = document.getElementById('product-list');
    const hero = document.getElementById('hero-section');
    container.innerHTML = '';
    
    if ((state.activeCategory === "ALL" || state.activeCategory === "SIGNATURE") && state.searchQuery === "") {
        const f = menuData[0]; 
        hero.innerHTML = `
            <div class="bg-espresso rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-premium text-ivory fade-in">
                <div class="w-full md:w-2/5 p-10 flex flex-col justify-center">
                    <p class="text-gold text-xs font-bold tracking-[0.2em] uppercase mb-4">Today at Anora</p>
                    <h2 class="font-serif text-3xl mb-4 leading-tight">${f.name}</h2>
                    <p class="text-sand/80 text-sm mb-8 leading-relaxed">${f.desc}</p>
                    <div class="flex items-center justify-between mt-auto">
                        <span class="font-serif text-2xl text-white">₹${f.price}</span>
                        <button onclick="quickAdd('${f.id}')" class="bg-white text-espresso px-6 py-3 rounded-lg font-semibold tracking-wide text-sm hover:bg-gold hover:text-white transition-colors btn-press shadow-lg">
                            ADD TO ORDER
                        </button>
                    </div>
                </div>
                <div class="w-full md:w-3/5 h-64 md:h-auto bg-charcoal">
                    <img src="${f.image}" class="w-full h-full object-cover" onerror="imgFallback(this)">
                </div>
            </div>
        `;
        hero.classList.remove('hidden');
    } else {
        hero.classList.add('hidden');
    }

    let displayCats = state.activeCategory === "ALL" ? categories.filter(c => c.name !== "ALL").map(c=>c.name) : [state.activeCategory];
    let hasResults = false;
    let staggerDelay = 0;

    displayCats.forEach(cat => {
        let products = menuData.filter(p => p.category === cat);
        if(state.searchQuery) {
            products = menuData.filter(p => p.name.toLowerCase().includes(state.searchQuery));
            if(cat !== categories[1].name) return;
        }

        if(products.length > 0) {
            hasResults = true;
            let headerText = state.searchQuery ? "Search Results" : cat;
            let subText = state.searchQuery ? "" : (cat === "SIGNATURE" ? "Chef-selected favourites" : "Made for the ANORA table");

            const section = document.createElement('div');
            section.innerHTML = `
                <div class="mb-6 fade-in">
                    <h2 class="font-sans font-bold text-2xl tracking-tight text-espresso">${headerText}</h2>
                    ${subText ? `<p class="text-taupe text-sm mt-1">${subText}</p>` : ''}
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 product-grid"></div>
            `;
            container.appendChild(section);
            
            const grid = section.querySelector('.product-grid');
            products.forEach(p => {
                const card = document.createElement('div');
                card.className = 'bg-white rounded-[20px] overflow-hidden shadow-premium card-hover cursor-pointer border border-sand/50 flex flex-col h-full stagger-item';
                card.style.animation = `slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}s forwards`;
                staggerDelay += 0.04;
                
                let tagHtml = p.tag ? `<div class="absolute top-4 left-4 ${p.tag === 'BESTSELLER' ? 'bg-gold text-espresso' : 'bg-burgundy text-white'} text-[10px] font-bold tracking-[0.1em] px-3 py-1.5 rounded-full uppercase shadow-md">${p.tag}</div>` : '';

                card.innerHTML = `
                    <div class="relative h-48 overflow-hidden bg-cream" onclick="openProductModal('${p.id}')">
                        <img src="${p.image}" class="w-full h-full object-cover product-img" onerror="imgFallback(this)">
                        ${tagHtml}
                    </div>
                    <div class="p-5 flex flex-col flex-1" onclick="openProductModal('${p.id}')">
                        <h3 class="font-serif text-lg text-espresso leading-snug mb-2 pr-4">${p.name}</h3>
                        <p class="text-taupe text-xs leading-relaxed line-clamp-2 mb-4 flex-1">${p.desc}</p>
                        <div class="flex items-center justify-between mt-auto">
                            <span class="font-semibold text-lg text-burgundy">₹${p.price}</span>
                            <button onclick="event.stopPropagation(); quickAdd('${p.id}')" class="bg-cream text-espresso px-4 py-2 rounded-lg text-sm font-semibold hover:bg-espresso hover:text-white transition-colors flex items-center gap-1 btn-press border border-sand">
                                <i data-lucide="plus" class="w-4 h-4"></i> ADD
                            </button>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    });

    if(!hasResults) {
        container.innerHTML = `
            <div class="text-center py-20 fade-in">
                <i data-lucide="search-x" class="w-16 h-16 text-sand mx-auto mb-6"></i>
                <h2 class="font-serif text-3xl text-espresso mb-2">No results found</h2>
                <p class="text-taupe mb-8">We couldn't find anything matching "${state.searchQuery}".</p>
                <button onclick="setCategory('ALL')" class="bg-white border border-sand text-charcoal px-6 py-3 rounded-xl font-semibold tracking-wide hover:bg-cream transition-colors btn-press">
                    CLEAR SEARCH
                </button>
            </div>
        `;
    }
    lucide.createIcons();
}

/* ==========================================================================
    3. CART & CHECKOUT
    ========================================================================== */
function quickAdd(id) {
    addToCart(id, 1);
    const cartBar = document.getElementById('floating-cart');
    cartBar.classList.remove('pulse-active');
    void cartBar.offsetWidth;
    cartBar.classList.add('pulse-active');
    showToast(menuData.find(x => x.id === id));
}

function showToast(product) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <img src="${product.image}" onerror="imgFallback(this)">
        <div>
            <p class="text-xs font-bold text-burgundy tracking-wider uppercase mb-0.5">Added</p>
            <p class="font-serif text-sm text-espresso leading-tight">${product.name}</p>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

let activeModalProduct = null;
function openProductModal(id) {
    activeModalProduct = menuData.find(p => p.id === id);
    document.getElementById('modal-img').src = activeModalProduct.image;
    document.getElementById('modal-title').innerText = activeModalProduct.name;
    document.getElementById('modal-price').innerText = `₹${activeModalProduct.price}`;
    document.getElementById('modal-desc').innerText = activeModalProduct.desc;
    document.getElementById('modal-qty').innerText = "1";
    document.getElementById('modal-total-btn').innerText = `₹${activeModalProduct.price}`;
    
    const overlay = document.getElementById('product-overlay');
    const modal = document.getElementById('product-modal');
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.remove('scale-95', 'opacity-0');
}

function closeModal() {
    document.getElementById('product-overlay').classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('product-modal').classList.add('scale-95', 'opacity-0');
    activeModalProduct = null;
}

function updateModalQty(change) {
    let q = parseInt(document.getElementById('modal-qty').innerText) + change;
    if(q < 1) q = 1;
    document.getElementById('modal-qty').innerText = q;
    document.getElementById('modal-total-btn').innerText = `₹${activeModalProduct.price * q}`;
}

function addFromModal() {
    const q = parseInt(document.getElementById('modal-qty').innerText);
    addToCart(activeModalProduct.id, q);
    closeModal();
    showToast(activeModalProduct);
    const cartBar = document.getElementById('floating-cart');
    cartBar.classList.remove('pulse-active');
    void cartBar.offsetWidth;
    cartBar.classList.add('pulse-active');
}

function addToCart(id, qty) {
    const product = menuData.find(p => p.id === id);
    if(state.cart[id]) state.cart[id].qty += qty;
    else state.cart[id] = { product, qty };
    updateCartUI();
}

function updateCartQty(id, change) {
    if(state.cart[id]) {
        state.cart[id].qty += change;
        if(state.cart[id].qty <= 0) delete state.cart[id];
    }
    updateCartUI();
}

function calculateTotals() {
    let subtotal = 0; let count = 0;
    Object.values(state.cart).forEach(item => {
        subtotal += item.product.price * item.qty;
        count += item.qty;
    });
    let gst = Math.round(subtotal * GST_RATE);
    return { subtotal, gst, total: subtotal + gst, count };
}

function updateCartUI() {
    const { subtotal, gst, total, count } = calculateTotals();
    
    if(count > 0) localStorage.setItem('anora_cart_v2', JSON.stringify(state.cart));
    else localStorage.removeItem('anora_cart_v2');

    document.getElementById('cart-qty').innerText = count;
    document.getElementById('cart-total').innerText = `₹${total}`;
    const badge = document.getElementById('cart-badge');
    if(count > 0) { badge.innerText = count; badge.classList.remove('hidden'); } 
    else { badge.classList.add('hidden'); }

    document.getElementById('drawer-qty').innerText = `${count} items`;
    document.getElementById('drawer-subtotal').innerText = `₹${subtotal}`;
    document.getElementById('drawer-gst').innerText = `₹${gst}`;
    document.getElementById('drawer-total').innerText = `₹${total}`;

    const container = document.getElementById('cart-items-container');
    const btnCheckout = document.getElementById('btn-checkout');

    if(count === 0) {
        container.innerHTML = `
            <div class="flex-1 flex flex-col items-center justify-center text-center px-4">
                <i data-lucide="shopping-bag" class="w-16 h-16 text-sand mb-6"></i>
                <h3 class="font-serif text-xl text-espresso mb-2">Nothing here yet.</h3>
                <p class="text-taupe text-sm">Start with a coffee, then see where the menu takes you.</p>
            </div>
        `;
        btnCheckout.disabled = true;
        btnCheckout.classList.add('opacity-50', 'pointer-events-none');
    } else {
        btnCheckout.disabled = false;
        btnCheckout.classList.remove('opacity-50', 'pointer-events-none');
        container.innerHTML = Object.values(state.cart).map(item => `
            <div class="flex gap-4 fade-in items-center">
                <img src="${item.product.image}" class="w-20 h-20 rounded-lg object-cover border border-sand shrink-0" onerror="imgFallback(this)">
                <div class="flex-1">
                    <h4 class="font-serif text-espresso leading-tight mb-1 pr-2">${item.product.name}</h4>
                    <p class="text-burgundy font-semibold text-sm mb-3">₹${item.product.price}</p>
                    <div class="flex items-center gap-4 bg-cream inline-flex rounded-lg border border-sand">
                        <button onclick="updateCartQty('${item.product.id}', -1)" class="w-8 h-8 flex items-center justify-center text-espresso hover:text-burgundy transition-colors">-</button>
                        <span class="font-semibold text-sm w-4 text-center">${item.qty}</span>
                        <button onclick="updateCartQty('${item.product.id}', 1)" class="w-8 h-8 flex items-center justify-center text-espresso hover:text-burgundy transition-colors">+</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    lucide.createIcons();
}

function toggleCartDrawer() {
    const overlay = document.getElementById('cart-overlay');
    const drawer = document.getElementById('cart-drawer');
    if(drawer.classList.contains('drawer-open')) {
        drawer.classList.remove('drawer-open');
        drawer.classList.add('drawer-closed');
        overlay.classList.remove('opacity-100', 'pointer-events-auto');
        overlay.classList.add('opacity-0', 'pointer-events-none');
    } else {
        updateCartUI();
        drawer.classList.remove('drawer-closed');
        drawer.classList.add('drawer-open');
        overlay.classList.remove('opacity-0', 'pointer-events-none');
        overlay.classList.add('opacity-100', 'pointer-events-auto');
    }
}

function switchScreen(screenId) {
    if(document.getElementById('cart-drawer').classList.contains('drawer-open')) toggleCartDrawer();
    closeModal();

    if(state.currentScreen !== screenId && screenId !== 'screen-welcome' && screenId !== 'screen-success') {
        state.screenHistory.push(state.currentScreen);
    }
    
    document.querySelectorAll('body > div[id^="screen-"]').forEach(s => {
        if(!s.classList.contains('hidden')) {
            s.classList.add('hidden');
        }
    });
    
    const target = document.getElementById(screenId);
    target.classList.remove('hidden');
    target.classList.add('fade-in');
    state.currentScreen = screenId;

    const soBtn = document.getElementById('btn-start-over');
    if(['screen-welcome', 'screen-menu', 'screen-success'].includes(screenId)) {
        soBtn.classList.add('hidden');
    } else {
        soBtn.classList.remove('hidden');
    }
}

function goBack() {
    if(state.screenHistory.length > 0) {
        const prev = state.screenHistory.pop();
        switchScreen(prev);
        state.screenHistory.pop(); 
    } else {
        switchScreen('screen-menu');
    }
}

function proceedToOrderType() {
    if(Object.keys(state.cart).length === 0) return;
    switchScreen('screen-order-type');
}

function selectOrderType(type) {
    state.orderType = type;
    if(type === 'dine-in') {
        renderTables();
        switchScreen('screen-table');
    } else {
        state.tableNumber = null;
        proceedToReview();
    }
}

function renderTables() {
    const grid = document.getElementById('table-grid');
    grid.innerHTML = Array.from({length: 8}, (_, i) => `
        <button onclick="selectTable('0${i+1}')" class="py-6 bg-white border-2 rounded-xl text-lg font-semibold transition-all btn-press ${state.tableNumber === `0${i+1}` ? 'border-espresso bg-espresso text-ivory shadow-lg' : 'border-sand text-charcoal hover:border-gold hover:shadow-md'}">
            Table 0${i+1}
        </button>
    `).join('');
}

function selectTable(num) {
    state.tableNumber = num;
    renderTables();
    document.getElementById('btn-confirm-table').classList.remove('hidden');
}

function proceedToReview() {
    const { subtotal, gst, total } = calculateTotals();
    document.getElementById('review-type-label').innerText = state.orderType === 'dine-in' ? `DINE IN • TABLE ${state.tableNumber}` : 'TAKEAWAY';
    document.getElementById('review-items').innerHTML = Object.values(state.cart).map(item => `
        <div class="flex justify-between items-center bg-cream p-4 rounded-xl border border-sand">
            <span class="text-charcoal"><span class="font-bold w-6 inline-block">${item.qty}</span> <span class="text-taupe mx-1">×</span> ${item.product.name}</span>
            <span class="font-semibold text-espresso">₹${item.product.price * item.qty}</span>
        </div>
    `).join('');
    document.getElementById('review-subtotal').innerText = `₹${subtotal}`;
    document.getElementById('review-gst').innerText = `₹${gst}`;
    document.getElementById('review-total').innerText = `₹${total}`;
    document.querySelectorAll('.flow-total').forEach(el => el.innerText = `₹${total}`);
    switchScreen('screen-review');
}

function showPaymentFlow(method) {
    state.paymentMethod = method;
    document.getElementById('view-cash').classList.add('hidden');
    document.getElementById('view-upi').classList.add('hidden');
    if(method === 'cash') document.getElementById('view-cash').classList.remove('hidden');
    else document.getElementById('view-upi').classList.remove('hidden');
    switchScreen('screen-pay-flow');
}

function completeOrder(method) {
    const { subtotal, gst, total } = calculateTotals();
    lastOrderNumber++;
    localStorage.setItem('anora_last_order', lastOrderNumber);
    const orderNum = `ANR-${lastOrderNumber}`;

    state.orderData = {
        id: orderNum,
        date: new Date().toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'}),
        time: new Date().toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'}),
        items: Object.values(state.cart),
        subtotal, gst, total,
        type: state.orderType,
        table: state.tableNumber,
        method: method
    };

    document.getElementById('final-order-number').innerText = `#${orderNum}`;
    document.getElementById('success-instruction').innerText = method === 'CASH' 
        ? "Please proceed to the counter to complete your payment." 
        : "Your order has been received and is being prepared.";

    state.cart = {};
    localStorage.removeItem('anora_cart_v2');

    switchScreen('screen-success');

    autoResetTimer = setTimeout(() => {
        resetToAttractMode();
    }, ATTRACT_RESET_DELAY);
}

function showReceipt() {
    clearTimeout(autoResetTimer); 
    
    const order = state.orderData;
    if(!order) return;

    let itemsHtml = order.items.map(item => `
        <div class="flex justify-between mb-2 text-sm">
            <span>${item.qty}x ${item.product.name}</span>
            <span>₹${item.product.price * item.qty}</span>
        </div>
    `).join('');

    document.getElementById('receipt-content').innerHTML = `
        <div class="text-center mb-6">
            <h2 class="text-2xl tracking-widest font-bold">ANORA</h2>
            <p class="text-[10px] tracking-widest uppercase mt-1">Coffee. Food. Moments.</p>
        </div>
        <div class="border-t border-dashed border-gray-400 my-4"></div>
        <div class="text-sm mb-4">
            <div class="flex justify-between mb-1"><span>Order:</span> <span>#${order.id}</span></div>
            <div class="flex justify-between mb-1"><span>Date:</span> <span>${order.date}</span></div>
            <div class="flex justify-between mb-1"><span>Time:</span> <span>${order.time}</span></div>
            <div class="flex justify-between mb-1"><span>Type:</span> <span>${order.type === 'dine-in' ? `Dine In (T${order.table})` : 'Takeaway'}</span></div>
        </div>
        <div class="border-t border-dashed border-gray-400 my-4"></div>
        <div class="mb-4">${itemsHtml}</div>
        <div class="border-t border-dashed border-gray-400 my-4"></div>
        <div class="text-sm">
            <div class="flex justify-between mb-1 text-gray-600"><span>Subtotal:</span> <span>₹${order.subtotal}</span></div>
            <div class="flex justify-between mb-1 text-gray-600"><span>GST 5%:</span> <span>₹${order.gst}</span></div>
            <div class="flex justify-between font-bold text-lg mt-3"><span>TOTAL:</span> <span>₹${order.total}</span></div>
        </div>
        <div class="border-t border-dashed border-gray-400 my-4"></div>
        <div class="text-center text-xs text-gray-600 mt-6">
            <p>Payment: ${order.method}</p>
            <p class="mt-4">Thank you for visiting ANORA.</p>
        </div>
    `;
    
    const overlay = document.getElementById('receipt-overlay');
    const modal = document.getElementById('receipt-modal');
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100', 'pointer-events-auto');
    modal.classList.remove('scale-95', 'opacity-0');
    modal.classList.add('scale-100', 'opacity-100');
}

/* ==========================================================================
    4. INACTIVITY TIMEOUT LOGIC
    ========================================================================== */
function setupIdleMonitoring() {
    ['load', 'mousemove', 'mousedown', 'touchstart', 'click', 'keypress'].forEach(evt => {
        window.addEventListener(evt, resetIdleTimer);
    });
}

function resetIdleTimer() {
    clearTimeout(idleTimer);
    clearTimeout(idleWarningTimer);
    
    if (state.currentScreen !== 'screen-welcome' && state.currentScreen !== 'screen-success') {
        hideIdleWarning();
        idleTimer = setTimeout(showIdleWarning, IDLE_LIMIT);
    }
}

function showIdleWarning() {
    const overlay = document.getElementById('idle-overlay');
    const modal = document.getElementById('idle-modal');
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.remove('scale-95', 'opacity-0');
    
    idleWarningTimer = setTimeout(() => {
        resetToAttractMode();
    }, WARNING_LIMIT);
}

function hideIdleWarning() {
    const overlay = document.getElementById('idle-overlay');
    const modal = document.getElementById('idle-modal');
    if (overlay) overlay.classList.add('opacity-0', 'pointer-events-none');
    if (modal) modal.classList.add('scale-95', 'opacity-0');
}

function continueSession() {
    hideIdleWarning();
    resetIdleTimer();
}

window.onload = init;