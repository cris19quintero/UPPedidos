// --- Configuración de API ---
const API_BASE_URL = 'http://localhost:5000/api';

// --- Cliente API ---
async function apiGet(endpoint) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error('Error en la petición');
    return response.json();
}

async function apiPost(endpoint, data) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error en la petición');
    return response.json();
}

// --- Datos locales de fallback ---
const cafeteriaDataFallback = [
    {
        id_cafeteria: 1,
        title: 'Cafetería Edificio 1',
        description: 'Menú disponible',
        categories: [
            {
                nombre: 'Desayunos',
                productos: [
                    { id_producto: 1, nombre: 'Desayuno Panameño', precio: 4.50, descripcion: 'Huevos, tortilla, queso, café', imagen: 'default-food.jpg' }
                ]
            },
            {
                nombre: 'Almuerzos',
                productos: [
                    { id_producto: 2, nombre: 'Pollo Guisado', precio: 5.50, descripcion: 'Pollo guisado, arroz, ensalada', imagen: 'default-food.jpg' }
                ]
            }
        ]
    }
];

// --- Variables globales ---
let cartItems = [];
let currentCafeteria = null;

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    loadCartFromStorage();
    updateCartCount();

    document.getElementById('cart-btn').addEventListener('click', openCart);
    document.getElementById('cart-modal').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeCart();
    });

    // Animaciones tarjetas cafetería
    const cards = document.querySelectorAll('.cafeteria-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / centerY * -10;
            const rotateY = (x - centerX) / centerX * 10;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.5s ease';
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
            setTimeout(() => card.style.transition = '', 500);
        });
    });
});

// --- Usuario ---
function loadUserData() {
    const email = localStorage.getItem('utpedidos_email') || sessionStorage.getItem('utpedidos_email');
    if (email) {
        const userName = email.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        document.getElementById('welcome-text').textContent = 'Bienvenido, ' + userName;
    }
}

// --- Mostrar cafeterías ---
function showCafeterias() {
    document.getElementById('cafeterias-view').style.display = 'block';
    document.getElementById('menu-view').style.display = 'none';
    document.body.className = '';
    currentCafeteria = null;
}

// --- Mostrar menú ---
async function showMenu(cafeteriaId) {
    currentCafeteria = cafeteriaId;
    document.body.className = `cafeteria-${cafeteriaId}`;

    let data;
    try {
        const response = await apiGet(`/cafeteria/${cafeteriaId}/menu`);
        data = response.success ? response : cafeteriaDataFallback[0];
    } catch {
        data = cafeteriaDataFallback[0];
    }

    document.getElementById('cafeteria-title').textContent = data.title || `Cafetería #${cafeteriaId}`;
    document.getElementById('cafeteria-description').textContent = data.description || 'Menú disponible';

    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = '';

    data.categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'menu-category';

        let categoryHTML = `<h3>${category.nombre}</h3><div class="menu-items">`;
        category.productos.forEach(item => {
            categoryHTML += `
                <div class="menu-item">
                    <div class="menu-item-image">
                        <img src="${item.imagen}" alt="${item.nombre}">
                    </div>
                    <div class="menu-item-details">
                        <h4>${item.nombre}</h4>
                        <p>${item.descripcion}</p>
                        <div class="price-add">
                            <span class="price">${item.precio.toFixed(2)}</span>
                            <button class="add-to-cart-btn" onclick="addToCart('${item.nombre}', ${item.precio}, '${data.title}', '${item.imagen}')">
                                <i class="fas fa-plus"></i> Agregar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        categoryHTML += '</div>';
        categoryDiv.innerHTML = categoryHTML;
        menuContainer.appendChild(categoryDiv);
    });

    document.getElementById('cafeterias-view').style.display = 'none';
    document.getElementById('menu-view').style.display = 'block';

    setTimeout(() => {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach((item, index) => item.style.animationDelay = `${index * 0.1}s`);
    }, 100);
}

// --- Carrito ---
function addToCart(name, price, cafeteria, image) {
    const existingItem = cartItems.find(item => item.name === name && item.cafeteria === cafeteria);
    if (existingItem) existingItem.quantity += 1;
    else cartItems.push({ name, price: parseFloat(price), cafeteria, image, quantity: 1 });

    saveCartToStorage();
    updateCartCount();
    showToast(`${name} añadido al carrito`);
    animateCartIcon();
}

function saveCartToStorage() { localStorage.setItem('utpedidos_cart', JSON.stringify(cartItems)); }
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('utpedidos_cart');
    if (savedCart) cartItems = JSON.parse(savedCart);
}
function updateCartCount() {
    const total = cartItems.reduce((sum, i) => sum + i.quantity, 0);
    document.getElementById('cart-count').textContent = total;
}

function openCart() { renderCartItems(); document.getElementById('cart-modal').style.display = 'flex'; }
function closeCart() { document.getElementById('cart-modal').style.display = 'none'; }

function renderCartItems() {
    const container = document.getElementById('cart-items');
    container.innerHTML = '';
    if (cartItems.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#666;">Tu carrito está vacío</p>';
        document.getElementById('cart-total').textContent = '$0.00';
        return;
    }

    let total = 0;
    const cafeteriaGroups = {};
    cartItems.forEach(item => {
        if (!cafeteriaGroups[item.cafeteria]) cafeteriaGroups[item.cafeteria] = [];
        cafeteriaGroups[item.cafeteria].push(item);
    });

    Object.keys(cafeteriaGroups).forEach(cafeteria => {
        const header = document.createElement('h4');
        header.textContent = cafeteria;
        header.style.margin = '20px 0 10px';
        header.style.color = 'var(--theme-color, var(--primary))';
        header.style.borderBottom = '2px solid var(--theme-color, var(--primary))';
        header.style.paddingBottom = '5px';
        container.appendChild(header);

        cafeteriaGroups[cafeteria].forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${item.price.toFixed(2)} x ${item.quantity} = ${itemTotal.toFixed(2)}</div>
                </div>
                <div class="cart-item-actions">
                    <div class="cart-item-quantity">
                        <button class="qty-btn" onclick="decreaseQuantity('${item.name}','${item.cafeteria}')">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="increaseQuantity('${item.name}','${item.cafeteria}')">+</button>
                    </div>
                    <button class="remove-item" onclick="removeItem('${item.name}','${item.cafeteria}')">&times;</button>
                </div>
            `;
            container.appendChild(cartItem);
        });
    });

    document.getElementById('cart-total').textContent = '$' + total.toFixed(2);
}

function increaseQuantity(name, cafeteria) {
    const item = cartItems.find(i => i.name === name && i.cafeteria === cafeteria);
    if (item) { item.quantity += 1; saveCartToStorage(); updateCartCount(); renderCartItems(); }
}

function decreaseQuantity(name, cafeteria) {
    const item = cartItems.find(i => i.name === name && i.cafeteria === cafeteria);
    if (!item) return;
    if (item.quantity > 1) item.quantity -= 1;
    else { removeItem(name, cafeteria); return; }
    saveCartToStorage(); updateCartCount(); renderCartItems();
}

function removeItem(name, cafeteria) {
    cartItems = cartItems.filter(i => !(i.name === name && i.cafeteria === cafeteria));
    saveCartToStorage(); updateCartCount(); renderCartItems();
}

// --- Checkout ---
async function checkout() {
    if (cartItems.length === 0) { showToast('Tu carrito está vacío'); return; }

    const selectedPayment = document.querySelector('input[name="payment"]:checked')?.value || 'efectivo';

    const itemsByCafeteria = cartItems.reduce((groups, item) => {
        if (!groups[item.cafeteria]) groups[item.cafeteria] = [];
        groups[item.cafeteria].push(item);
        return groups;
    }, {});

    try {
        for (const [cafeteriaName, items] of Object.entries(itemsByCafeteria)) {
            const cafeteria = cafeteriaDataFallback.find(c => c.title === cafeteriaName) || { id_cafeteria: 1 };
            const pedidoData = {
                cafeteria_id: cafeteria.id_cafeteria,
                horario_id: 1,
                items: items.map(i => ({ producto_id: i.id_producto || 1, quantity: i.quantity, price: i.price })),
                notas: `Pedido desde web - ${new Date().toLocaleString()}`
            };
            await apiPost('/pedido', pedidoData);
        }
        showToast('¡Pedido realizado exitosamente!');
        cartItems = []; saveCartToStorage(); updateCartCount(); closeCart();
    } catch {
        showToast('Error al realizar el pedido, intenta más tarde');
    }
}

// --- Utilidades ---
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

function animateCartIcon() {
    const cartBtn = document.getElementById('cart-btn');
    cartBtn.classList.add('added-animation');
    setTimeout(() => cartBtn.classList.remove('added-animation'), 500);
}
