// --- Configuración de API ---
const API_BASE_URL = 'http://localhost:5000/api';

// --- Cliente API mejorado ---
async function apiGet(endpoint) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log('🌐 Haciendo request a:', url);
        
        const response = await fetch(url, { 
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Respuesta recibida:', data);
        return data;
    } catch (error) {
        console.error('❌ Error en API:', error);
        throw error;
    }
}

async function apiPost(endpoint, data) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log('🌐 POST a:', url, 'con datos:', data);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ POST exitoso:', result);
        return result;
    } catch (error) {
        console.error('❌ Error en POST:', error);
        throw error;
    }
}

// --- Datos locales de fallback (mejorados) ---
const cafeteriaDataFallback = {
    1: {
        id_cafeteria: 1,
        nombre: 'CAFETERÍA #1',
        descripcion: 'Edificio No. 1',
        categoria: [
            {
                id_producto: 1,
                nombre_producto: 'Desayuno Panameño',
                descripcion: 'Huevos revueltos, tortilla, queso blanco, café',
                precio: 4.50,
                categoria_nombre: 'Desayunos',
                horario_nombre: 'Desayuno'
            },
            {
                id_producto: 2,
                nombre_producto: 'Pollo Guisado',
                descripcion: 'Pollo guisado con arroz y ensalada',
                precio: 5.50,
                categoria_nombre: 'Almuerzos',
                horario_nombre: 'Almuerzo'
            }
        ]
    },
    2: {
        id_cafeteria: 2,
        nombre: 'CAFETERÍA #2',
        descripcion: 'Edificio No. 2',
        categoria: [
            {
                id_producto: 3,
                nombre_producto: 'Sandwich de Pollo',
                descripcion: 'Pan integral con pollo a la plancha',
                precio: 3.75,
                categoria_nombre: 'Sandwiches',
                horario_nombre: 'Merienda'
            }
        ]
    },
    3: {
        id_cafeteria: 3,
        nombre: 'CAFETERÍA #3',
        descripcion: 'Edificio No. 3',
        categoria: [
            {
                id_producto: 4,
                nombre_producto: 'Arroz con Pollo',
                descripcion: 'Arroz amarillo con pollo y vegetales',
                precio: 6.00,
                categoria_nombre: 'Almuerzos',
                horario_nombre: 'Almuerzo'
            }
        ]
    }
};

// --- Variables globales ---
let cartItems = [];
let currentCafeteria = null;
let horarios = [];

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', async () => {
    loadUserData();
    loadCartFromStorage();
    updateCartCount();
    
    // Cargar horarios disponibles
    await loadHorarios();

    document.getElementById('cart-btn').addEventListener('click', openCart);
    document.getElementById('cart-modal').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeCart();
    });

    // Animaciones tarjetas cafetería
    initCafeteriaAnimations();
});

// --- Cargar horarios desde API ---
async function loadHorarios() {
    try {
        const response = await apiGet('/horarios');
        if (response.success) {
            horarios = response.horarios;
        }
    } catch (error) {
        console.warn('⚠️ No se pudieron cargar horarios, usando valores por defecto');
        horarios = [
            { id_horario: 1, nombre: 'Desayuno' },
            { id_horario: 2, nombre: 'Almuerzo' },
            { id_horario: 3, nombre: 'Merienda' }
        ];
    }
}

// --- Usuario ---
function loadUserData() {
    const email = localStorage.getItem('utpedidos_email') || sessionStorage.getItem('utpedidos_email');
    if (email) {
        const userName = email.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        document.getElementById('welcome-text').textContent = 'Bienvenido, ' + userName;
    }
}

// --- Mostrar menú (CORREGIDO para usar tu API real) ---
async function showMenu(cafeteriaId) {
    currentCafeteria = cafeteriaId;
    document.body.className = `cafeteria-${cafeteriaId}`;

    let cafeteriaData;
    
    try {
        // 🔥 USANDO TU API REAL
        const response = await apiGet(`/categorias/${cafeteriaId}`);
        
        if (response.success && response.categoria) {
            // Transformar datos de tu API al formato que necesita el frontend
            cafeteriaData = {
                id_cafeteria: cafeteriaId,
                nombre: `CAFETERÍA #${cafeteriaId}`,
                descripcion: `Edificio No. ${cafeteriaId}`,
                categoria: response.categoria
            };
        } else {
            throw new Error('No se encontraron productos');
        }
    } catch (error) {
        console.warn('⚠️ Usando datos de fallback:', error);
        cafeteriaData = cafeteriaDataFallback[cafeteriaId];
    }

    if (!cafeteriaData) {
        showToast('No se pudo cargar el menú de esta cafetería');
        return;
    }

    // Actualizar interfaz
    document.getElementById('cafeteria-title').textContent = cafeteriaData.nombre;
    document.getElementById('cafeteria-description').textContent = cafeteriaData.descripcion;

    // Agrupar productos por categoría
    const productosPorCategoria = {};
    cafeteriaData.productos.forEach(producto => {
        const categoria = producto.categoria_nombre || 'Otros';
        if (!productosPorCategoria[categoria]) {
            productosPorCategoria[categoria] = [];
        }
        productosPorCategoria[categoria].push(producto);
    });

    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = '';

    // Renderizar cada categoría
    Object.keys(productosPorCategoria).forEach(categoria => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'menu-category';

        let categoryHTML = `<h3>${categoria}</h3><div class="menu-items">`;
        
        productosPorCategoria[categoria].forEach(producto => {
            const imageName = producto.imagen || `${producto.nombre_producto.toLowerCase().replace(/\s+/g, '-')}.jpg`;
            
            categoryHTML += `
                <div class="menu-item">
                    <div class="menu-item-image">
                        <img src="../imagenes/${imageName}" 
                             alt="${producto.nombre_producto}"
                             onerror="this.src='../imagenes/default-food.jpg'">
                    </div>
                    <div class="menu-item-details">
                        <h4>${producto.nombre_producto}</h4>
                        <p>${producto.descripcion}</p>
                        <div class="price-add">
                            <span class="price">$${parseFloat(producto.precio).toFixed(2)}</span>
                            <button class="add-to-cart-btn" 
                                    onclick="addToCart('${producto.nombre_producto}', ${producto.precio}, '${cafeteriaData.nombre}', '../imagenes/${imageName}', ${producto.id_producto})">
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

    // Animaciones
    setTimeout(() => {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach((item, index) => item.style.animationDelay = `${index * 0.1}s`);
    }, 100);
}

// --- Carrito (actualizado) ---
function addToCart(name, price, cafeteria, image, productoId = null) {
    const existingItem = cartItems.find(item => item.name === name && item.cafeteria === cafeteria);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({ 
            name, 
            price: parseFloat(price), 
            cafeteria, 
            image, 
            quantity: 1,
            producto_id: productoId || 1 // Para la API
        });
    }

    saveCartToStorage();
    updateCartCount();
    showToast(`${name} añadido al carrito`);
    animateCartIcon();
}

// --- Checkout (usando tu API real) ---
async function checkout() {
    if (cartItems.length === 0) { 
        showToast('Tu carrito está vacío'); 
        return; 
    }

    const selectedPayment = document.querySelector('input[name="payment"]:checked')?.value || 'efectivo';

    // Agrupar items por cafetería
    const itemsByCafeteria = cartItems.reduce((groups, item) => {
        if (!groups[item.cafeteria]) groups[item.cafeteria] = [];
        groups[item.cafeteria].push(item);
        return groups;
    }, {});

    try {
        for (const [cafeteriaName, items] of Object.entries(itemsByCafeteria)) {
            // Extraer ID de cafetería del nombre
            const cafeteriaId = parseInt(cafeteriaName.match(/\d+/)[0]);
            
            const pedidoData = {
                cafeteria_id: cafeteriaId,
                horario_id: 1, // Por defecto, o determinar según la hora
                items: items.map(item => ({
                    producto_id: item.producto_id,
                    quantity: item.quantity,
                    price: item.price
                })),
                notas: `Pedido desde web - Método de pago: ${selectedPayment}`
            };
            
            console.log('🛒 Enviando pedido:', pedidoData);
            const response = await apiPost('/pedido', pedidoData);
            
            if (response.success) {
                console.log('✅ Pedido creado:', response.pedido_id);
            }
        }
        
        showToast('¡Pedido realizado exitosamente!');
        cartItems = []; 
        saveCartToStorage(); 
        updateCartCount(); 
        closeCart();
        
    } catch (error) {
        console.error('❌ Error en checkout:', error);
        showToast('Error al realizar el pedido. Intenta de nuevo.');
    }
}

// --- Funciones de animación ---
function initCafeteriaAnimations() {
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
}

// --- Resto de funciones (sin cambios) ---
function showCafeterias() {
    document.getElementById('cafeterias-view').style.display = 'block';
    document.getElementById('menu-view').style.display = 'none';
    document.body.className = '';
    currentCafeteria = null;
}

function saveCartToStorage() { 
    localStorage.setItem('utpedidos_cart', JSON.stringify(cartItems)); 
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('utpedidos_cart');
    if (savedCart) cartItems = JSON.parse(savedCart);
}

function updateCartCount() {
    const total = cartItems.reduce((sum, i) => sum + i.quantity, 0);
    document.getElementById('cart-count').textContent = total;
}

function openCart() { 
    renderCartItems(); 
    document.getElementById('cart-modal').style.display = 'flex'; 
}

function closeCart() { 
    document.getElementById('cart-modal').style.display = 'none'; 
}

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
                <img src="${item.image}" alt="${item.name}" class="cart-item-img" 
                     onerror="this.src='../imagenes/default-food.jpg'">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} x ${item.quantity} = $${itemTotal.toFixed(2)}</div>
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
    if (item) { 
        item.quantity += 1; 
        saveCartToStorage(); 
        updateCartCount(); 
        renderCartItems(); 
    }
}

function decreaseQuantity(name, cafeteria) {
    const item = cartItems.find(i => i.name === name && i.cafeteria === cafeteria);
    if (!item) return;
    
    if (item.quantity > 1) {
        item.quantity -= 1;
    } else { 
        removeItem(name, cafeteria); 
        return; 
    }
    
    saveCartToStorage(); 
    updateCartCount(); 
    renderCartItems();
}

function removeItem(name, cafeteria) {
    cartItems = cartItems.filter(i => !(i.name === name && i.cafeteria === cafeteria));
    saveCartToStorage(); 
    updateCartCount(); 
    renderCartItems();
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

function animateCartIcon() {
    const cartBtn = document.getElementById('cart-btn');
    cartBtn.classList.add('added-animation');
    setTimeout(() => cartBtn.classList.remove('added-animation'), 500);}