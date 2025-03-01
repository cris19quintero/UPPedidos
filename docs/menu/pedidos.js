
// Variables globales para el carrito y el historial de pedidos
let cartItems = [];
let ordersHistory = [];

// EVENTOS INICIALES
document.addEventListener('DOMContentLoaded', function() {
    // Actualizar el texto de bienvenida
    const email = localStorage.getItem('utpedidos_email') || sessionStorage.getItem('utpedidos_email');
    if (email) {
        const userName = email.split('@')[0];
        const formattedName = userName
            .split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        document.getElementById('welcome-text').textContent = 'Bienvenido, ' + formattedName;
    }
    
    // Efecto hover 3D en las cafeterías
    const cafeterias = document.querySelectorAll('.cafeteria');
    cafeterias.forEach(cafeteria => {
        cafeteria.addEventListener('mousemove', function(e) {
            const rect = cafeteria.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const maxRotation = 10;
            const rotateY = maxRotation * (x - centerX) / centerX;
            const rotateX = -maxRotation * (y - centerY) / centerY;
            cafeteria.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });
        cafeteria.addEventListener('mouseleave', function() {
            cafeteria.style.transition = 'transform 0.5s ease';
            cafeteria.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
            setTimeout(() => { cafeteria.style.transition = ''; }, 500);
        });
    });
    
    // Actualizar contador del carrito (si hay datos en localStorage)
    const savedCart = localStorage.getItem('upedidosCart');
    if (savedCart) {
        cartItems = JSON.parse(savedCart);
    }
    updateCartCount();
    
    // Asignar evento al botón del carrito
    const cartBtn = document.querySelector('.nav-button[title="Carrito"]');
    if (cartBtn) {
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openCart();
        });
    }
});

// FUNCIONES GENERALES
function cambiarCafeteria(cafeteriaId) {
    // En este caso no es necesario implementar
}

function volverAInicio() {
    window.location.href = 'menu.html';
}

function navigateTo(url) {
    document.body.classList.add('page-exit');
    setTimeout(() => { window.location.href = url; }, 300);
}

// Manejo de error en la carga de imágenes
function handleImageError(img) {
    img.src = "images/default-food.jpg"; // Imagen por defecto
    img.onerror = null;
}

// GUARDAR DATOS
function saveCartToLocalStorage() {
    localStorage.setItem('upedidosCart', JSON.stringify(cartItems));
}

function saveOrdersToLocalStorage() {
    localStorage.setItem('upedidosOrders', JSON.stringify(ordersHistory));
}

// NOTIFICACIONES Y ANIMACIONES
function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.background = 'rgba(0,0,0,0.8)';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '5px';
        toast.style.zIndex = '1000';
        toast.style.display = 'none';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

function animateCartIcon() {
    const cartIcon = document.getElementById('cart-btn');
    if (cartIcon) {
        cartIcon.classList.add('added-animation');
        setTimeout(() => { cartIcon.classList.remove('added-animation'); }, 500);
    }
}

// MODAL DEL CARRITO
function openCart() {
    renderCartItems();
    document.getElementById('cart-modal').style.display = 'flex';
}

function closeCart() {
    document.getElementById('cart-modal').style.display = 'none';
}

// FUNCIONES DEL CARRITO

/* Función mejorada para añadir un item al carrito.
   Recibe el evento como primer parámetro para poder buscar la imagen desde el DOM. */
function addToCart(e, name, price, cafeteria, image) {
    let imageSrc = '';
    // Si se pasó el evento, tratar de obtener la imagen de la tarjeta
    if (e && e.target) {
        const menuItem = e.target.closest('.menu-item');
        if (menuItem) {
            const imageElement = menuItem.querySelector('.menu-item-image img');
            if (imageElement && imageElement.src) {
                imageSrc = imageElement.src;
                console.log("Imagen encontrada:", imageSrc);
            }
        }
    }
    // Si no se encontró la imagen, usar la que se pasó o formar el nombre de archivo
    if (!imageSrc || imageSrc === '') {
        imageSrc = image || `${name.toLowerCase().replace(/ - /g, '-').replace(/ /g, '-')}.jpg`;
    }
    
    // Convertir precio a número
    price = parseFloat(price);
    
    // Buscar si el item ya existe
    const existingItemIndex = cartItems.findIndex(item => item.name === name && item.cafeteria === cafeteria);
    if (existingItemIndex !== -1) {
        cartItems[existingItemIndex].quantity += 1;
        if (imageSrc && imageSrc !== '') {
            cartItems[existingItemIndex].image = imageSrc;
        }
    } else {
        cartItems.push({
            name: name,
            price: price,
            cafeteria: cafeteria,
            quantity: 1,
            image: imageSrc
        });
    }
    
    updateCartCount();
    showToast(`${name} añadido al carrito`);
    animateCartIcon();
    saveCartToLocalStorage();
}

// Actualiza el contador del carrito (usando cartItems global)
function updateCartCount() {
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) { cartBadge.textContent = totalItems; }
    const cartCount = document.getElementById('cart-count');
    if (cartCount) { cartCount.textContent = totalItems; }
}

// Renderiza los items del carrito en el modal
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '';
    
    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '<p>Tu carrito está vacío.</p>';
        document.getElementById('cart-total').textContent = '$0.00';
        return;
    }
    
    let total = 0;
    // Agrupar por cafetería
    const cafeterias = [...new Set(cartItems.map(item => item.cafeteria))];
    cafeterias.forEach(cafeteria => {
        let cafeteriaColor = '';
        if (cafeteria === 'Cafetería #1') {
            cafeteriaColor = 'var(--cafe1-color,#ff9e80)';
        } else if (cafeteria === 'Cafetería #2') {
            cafeteriaColor = 'var(--cafe2-color, #80d8ff)';
        } else if (cafeteria === 'Cafetería #3') {
            cafeteriaColor = 'var(--cafe3-color, #8adc9d)';
        }
        
        // Crear encabezado de cafetería con color
        const cafeteriaHeader = document.createElement('h4');
        cafeteriaHeader.textContent = cafeteria;
        cafeteriaHeader.style.marginTop = '15px';
        cafeteriaHeader.style.padding = '5px';
        cafeteriaHeader.style.borderRadius = '8px' ;
        cafeteriaHeader.style.backgroundColor = cafeteriaColor;
        cafeteriaHeader.style.color = 'white';
        cartItemsContainer.appendChild(cafeteriaHeader);
        
        const cafeteriaItems = cartItems.filter(item => item.cafeteria === cafeteria);
        cafeteriaItems.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            
            // Verificar imagen: si no existe, usar placeholder y tratar de actualizar desde el DOM
            let imgSrc = (item.image && item.image !== '') ? item.image : '../imagenes/placeholder-food.png';
            if ((!item.image || item.image === '') && document.querySelectorAll('.menu-item').length > 0) {
                const menuItems = document.querySelectorAll('.menu-item');
                for (let menuItem of menuItems) {
                    const title = menuItem.querySelector('h4');
                    if (title && title.textContent === item.name) {
                        const img = menuItem.querySelector('.menu-item-image img');
                        if (img && img.src) {
                            imgSrc = img.src;
                            item.image = imgSrc;
                            break;
                        }
                    }
                }
            }
            
            cartItem.innerHTML = `
                <div class="cart-item-img-container">
                    <img src="${imgSrc}" alt="${item.name}" class="cart-item-img" onerror="handleImageError(this)">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} x ${item.quantity} = $${itemTotal.toFixed(2)}</div>
                </div>
                <div class="cart-item-actions">
                    <div class="cart-item-quantity">
                        <button class="qty-btn" onclick="decreaseQuantity('${item.name}', '${item.cafeteria}')">-</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="increaseQuantity('${item.name}', '${item.cafeteria}')">+</button>
                    </div>
                    <button class="remove-item" onclick="removeItem('${item.name}', '${item.cafeteria}')">×</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItem);
        });
    });
    
    document.getElementById('cart-total').textContent = '$' + total.toFixed(2);
    saveCartToLocalStorage();
}

// Aumenta la cantidad de un item
function increaseQuantity(name, cafeteria) {
    const item = cartItems.find(item => item.name === name && item.cafeteria === cafeteria);
    if (item) {
        item.quantity += 1;
        updateCartCount();
        renderCartItems();
        saveCartToLocalStorage();
    }
}

// Disminuye la cantidad de un item o lo elimina si es 1
function decreaseQuantity(name, cafeteria) {
    const item = cartItems.find(item => item.name === name && item.cafeteria === cafeteria);
    if (item && item.quantity > 1) {
        item.quantity -= 1;
        updateCartCount();
        renderCartItems();
        saveCartToLocalStorage();
    } else if (item && item.quantity === 1) {
        removeItem(name, cafeteria);
    }
}

// Elimina un item del carrito
function removeItem(name, cafeteria) {
    cartItems = cartItems.filter(item => !(item.name === name && item.cafeteria === cafeteria));
    updateCartCount();
    renderCartItems();
    saveCartToLocalStorage();
}

// FUNCIONES PARA PEDIDOS
function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

function getPickupTime() {
    const now = new Date();
    const randomMinutes = Math.floor(Math.random() * (120 - 30 + 1) + 30);
    now.setMinutes(now.getMinutes() + randomMinutes);
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

function checkout() {
    if (cartItems.length === 0) {
        showToast('Tu carrito está vacío');
        return;
    }
    
    // Obtener método de pago
    const selectedPayment = document.querySelector('input[name="payment"]:checked').value;
    const orderTime = getCurrentTime();
    
    cartItems.forEach(item => {
        const orderId = Date.now() + Math.floor(Math.random() * 1000);
        ordersHistory.push({
            id: orderId,
            name: item.name,
            description: "", // Puedes agregar descripción
            price: item.price,
            quantity: item.quantity,
            cafeteria: item.cafeteria,
            orderTime: orderTime,
            pickupTime: getPickupTime(),
            paymentMethod: selectedPayment,
            status: "pendiente",
            image: item.image || `${item.name.toLowerCase().replace(/ - /g, '-').replace(/ /g, '-')}.jpg`
        });
    });
    
    saveOrdersToLocalStorage();
    showToast('¡Gracias por tu pedido! Tu comida estará lista pronto.');
    cartItems = [];
    updateCartCount();
    closeCart();
    saveCartToLocalStorage();
    renderOrdersHistory();
}

function markAsPickedUp(orderId) {
    const orderIndex = ordersHistory.findIndex(order => order.id == orderId);
    if (orderIndex !== -1) {
        ordersHistory[orderIndex].status = "retirado";
        saveOrdersToLocalStorage();
        renderOrdersHistory();
        showToast('Pedido marcado como retirado');
    }
}

function renderOrdersHistory() {
    const pendingContainer = document.getElementById('pedidos-pendientes');
    const expiredContainer = document.getElementById('pedidos-expirados');
    pendingContainer.innerHTML = '';
    expiredContainer.innerHTML = '';
    
    const pendingOrders = ordersHistory.filter(order => order.status === 'pendiente');
    const expiredOrders = ordersHistory.filter(order => order.status === 'expirado' || order.status === 'retirado');
    
    if (pendingOrders.length === 0) {
        pendingContainer.innerHTML = '<p>No tienes pedidos pendientes por retirar.</p>';
    } else {
        pendingOrders.forEach(order => {
            renderOrderItem(order, pendingContainer);
        });
    }
    
    if (expiredOrders.length === 0) {
        expiredContainer.innerHTML = '<p>No tienes pedidos expirados o retirados.</p>';
    } else {
        expiredOrders.forEach(order => {
            renderOrderItem(order, expiredContainer);
        });
    }
}

function renderOrderItem(order, container) {
    const orderItem = document.createElement('div');
    orderItem.className = 'pedido-item';
    
    let cafeteriaClass = '';
    if (order.cafeteria === 'Cafetería #1') {
        cafeteriaClass = 'cafeteria-1';
    } else if (order.cafeteria === 'Cafetería #2') {
        cafeteriaClass = 'cafeteria-2';
    } else if (order.cafeteria === 'Cafetería #3') {
        cafeteriaClass = 'cafeteria-3';
    }
    
    let statusClass = '';
    let statusText = '';
    if (order.status === 'pendiente') {
        statusClass = 'status-pendiente';
        statusText = 'Pendiente de retirar';
    } else if (order.status === 'expirado') {
        statusClass = 'status-expirado';
        statusText = 'Expirado';
    } else if (order.status === 'retirado') {
        statusClass = 'status-retirado';
        statusText = 'Retirado con éxito';
    }
    
    const paymentMethodText = order.paymentMethod === 'visa' ? 'Tarjeta Visa' : 'Efectivo';
    const paymentIcon = order.paymentMethod === 'visa' ? 'fa-cc-visa' : 'fa-money-bill-wave';
    
    orderItem.innerHTML = `
        <img src="images/${order.image || `${order.name.toLowerCase().replace(/ - /g, '-').replace(/ /g, '-')}.jpg`}" alt="${order.name}" class="pedido-img" onerror="handleImageError(this)">
        <div class="pedido-info">
            <div>
                <div class="pedido-title">
                    ${order.name} <span class="pedido-quantity">x${order.quantity}</span>
                </div>
                <div class="pedido-desc">${order.description || 'Sin descripción'}</div>
                <div class="pedido-cafeteria ${cafeteriaClass}">
                    <i class="fas fa-store"></i> ${order.cafeteria}
                </div>
                <div class="pedido-tiempo">
                    <div class="pedido-hora">
                        <i class="far fa-clock"></i> Pedido: ${order.orderTime}
                    </div>
                    <div class="pedido-hora">
                        <i class="fas fa-hourglass-half"></i> Recogida: ${order.pickupTime}
                    </div>
                </div>
                <div class="pedido-pago">
                    <i class="fas ${paymentIcon}"></i> ${paymentMethodText}
                </div>
            </div>
            <div class="pedido-actions">
                <div class="pedido-status ${statusClass}">
                    ${statusText}
                </div>
                ${order.status === 'pendiente' ? 
                    `<button class="pickup-btn" onclick="markAsPickedUp(${order.id})">
                        <i class="fas fa-check"></i> Marcar como retirado
                    </button>` : 
                    ''}
            </div>
        </div>
    `;
    
    container.appendChild(orderItem);
}

function checkExpiredOrders() {
    const now = new Date();
    ordersHistory.forEach(order => {
        if (order.status === 'pendiente') {
            const [time, period] = order.pickupTime.split(' ');
            const [hours, minutes] = time.split(':');
            let pickupHours = parseInt(hours);
            if (period === 'PM' && pickupHours < 12) {
                pickupHours += 12;
            } else if (period === 'AM' && pickupHours === 12) {
                pickupHours = 0;
            }
            const pickupTime = new Date();
            pickupTime.setHours(pickupHours, parseInt(minutes), 0, 0);
            const expirationTime = new Date(pickupTime);
            expirationTime.setHours(expirationTime.getHours() + 1);
            if (now > expirationTime) {
                order.status = 'expirado';
            }
        }
    });
    saveOrdersToLocalStorage();
    renderOrdersHistory();
}

// INICIALIZACIÓN DE PEDIDOS Y COMPORTAMIENTO ADICIONAL
window.onload = function() {
    // Cargar carrito
    const savedCart = localStorage.getItem('upedidosCart');
    if (savedCart) {
        cartItems = JSON.parse(savedCart);
    }
    // Cargar pedidos
    const savedOrders = localStorage.getItem('upedidosOrders');
    if (savedOrders) {
        ordersHistory = JSON.parse(savedOrders);
    } else {
        ordersHistory = [
            {
                id: 1001,
                name: "Almuerzo - Opción 1",
                description: "Arroz blanco, porotos, pollo a la plancha, ensalada de lechuga, tomate y cebolla, tajadas",
                price: 8.50,
                quantity: 2,
                cafeteria: "Cafetería #3",
                orderTime: "11:30 AM",
                pickupTime: "12:30 PM",
                paymentMethod: "visa",
                status: "pendiente",
                image: "almuerzo-opcion-1.jpg"
            },
            {
                id: 1002,
                name: "Cena - Opción 1",
                description: "Arroz blanco, frijoles, ropa vieja, ensalada de repollo",
                price: 7.50,
                quantity: 1,
                cafeteria: "Cafetería #3",
                orderTime: "5:00 PM",
                pickupTime: "6:00 PM",
                paymentMethod: "efectivo",
                status: "pendiente",
                image: "cena-opcion-1.jpg"
            },
            {
                id: 1003,
                name: "Desayuno - Opción 3",
                description: "Pan frito, salchichas guisadas",
                price: 5.00,
                quantity: 1,
                cafeteria: "Cafetería #1",
                orderTime: "8:00 AM",
                pickupTime: "8:45 AM",
                paymentMethod: "visa",
                status: "expirado",
                image: "desayuno-opcion-3.jpg"
            }
        ];
        saveOrdersToLocalStorage();
    }
    
    updateCartCount();
    renderOrdersHistory();
    setInterval(checkExpiredOrders, 60000);
};

// Función para cargar productos de ejemplo (solo para demostración)
function loadSampleProducts() {
    const productos = [
        { name: "Almuerzo - Opción 1", price: 8.50, cafeteria: "Cafetería #3", image: "almuerzo-opcion-1.jpg" },
        { name: "Cena - Opción 1", price: 7.50, cafeteria: "Cafetería #3", image: "cena-opcion-1.jpg" },
        { name: "Desayuno - Opción 3", price: 5.00, cafeteria: "Cafetería #1", image: "desayuno-opcion-3.jpg" }
    ];
    const productContainer = document.getElementById('product-container');
    if (productContainer) {
        productContainer.innerHTML = '';
        productos.forEach(producto => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="images/${producto.image}" alt="${producto.name}" class="product-img" onerror="handleImageError(this)">
                <div class="product-title">${producto.name}</div>
                <div class="product-price">$${producto.price.toFixed(2)}</div>
                <button class="add-to-cart-btn" onclick="addToCart(event, '${producto.name}', ${producto.price}, '${producto.cafeteria}', '${producto.image}')">
                    <i class="fas fa-plus"></i> Añadir
                </button>
            `;
            productContainer.appendChild(productCard);
        });
    }
}

if (document.getElementById('product-container')) {
    loadSampleProducts();
}

// Agregar animación de entrada a la página
window.addEventListener('load', function() {
    document.body.classList.add('page-loaded');
    const cafeterias = document.querySelectorAll('.cafeteria');
    cafeterias.forEach((cafeteria, index) => {
        setTimeout(() => {
            cafeteria.classList.add('cafeteria-loaded');
        }, 200 * (index + 1));
    });
});

function iralPerfil(){
    window.location.href='../principal/perfil.html'
}