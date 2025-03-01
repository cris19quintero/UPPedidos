// Declarar las variables globales al inicio del script
let cartItems = [];
let ordersHistory = [];

document.addEventListener('DOMContentLoaded', function() {
    // Obtener nombre de usuario del almacenamiento local
    const email = localStorage.getItem('utpedidos_email') || sessionStorage.getItem('utpedidos_email');
    if (email) {
        // Extraer el nombre de usuario del correo (parte antes del @)
        const userName = email.split('@')[0];
        // Capitalizar la primera letra y reemplazar puntos por espacios
        const formattedName = userName
            .split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        
        // Actualizar el texto de bienvenida
        document.getElementById('welcome-text').textContent = 'Bienvenido, ' + formattedName;
    }
    
    // Agregar efecto de hover 3D a las cafeterías
    const cafeterias = document.querySelectorAll('.cafeteria');
    
    cafeterias.forEach(cafeteria => {
        cafeteria.addEventListener('mousemove', function(e) {
            const rect = cafeteria.getBoundingClientRect();
            const x = e.clientX - rect.left; // Posición X del mouse dentro del elemento
            const y = e.clientY - rect.top; // Posición Y del mouse dentro del elemento
            
            // Calcular rotación basada en la posición del cursor
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Limitar la rotación a un valor máximo
            const maxRotation = 10;
            const rotateY = maxRotation * (x - centerX) / centerX;
            const rotateX = -maxRotation * (y - centerY) / centerY;
            
            // Aplicar transformación
            cafeteria.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });
        
        cafeteria.addEventListener('mouseleave', function() {
            // Restaurar la transformación original con un efecto suave
            cafeteria.style.transition = 'transform 0.5s ease';
            cafeteria.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
            
            // Después de la transición, quitar la propiedad de transición para el hover 3D
            setTimeout(() => {
                cafeteria.style.transition = '';
            }, 500);
        });
    });
    
    // Cargar carrito desde localStorage
    const savedCart = localStorage.getItem('upedidosCart');
    if (savedCart) {
        cartItems = JSON.parse(savedCart);
    }
    
    // Cargar pedidos desde localStorage
    const savedOrders = localStorage.getItem('upedidosOrders');
    if (savedOrders) {
        ordersHistory = JSON.parse(savedOrders);
    } else {
        // Pedidos de demostración
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
            }
        ];
        saveOrdersToLocalStorage();
    }
    
    // Actualizar el contador del carrito
    updateCartCount();
    
    // Agregar event listener al botón del carrito
    document.querySelector('.nav-button[title="Carrito"]')?.addEventListener('click', function(e) {
        e.preventDefault();
        openCart();
    });
    
    // Verificar pedidos expirados cada minuto
    setInterval(checkExpiredOrders, 60000);
    
    // Cargar productos de ejemplo (si estamos en página de cafetería)
    if (document.getElementById('product-container')) {
        loadSampleProducts();
    }
    
    // Si estamos en la página de pedidos, renderizar el historial
    if (document.getElementById('pedidos-pendientes')) {
        renderOrdersHistory();
    }
});

// Función para cambiar entre cafeterías
function cambiarCafeteria(cafeteriaId) {
    // Implementación de la función de cambio de cafetería
    // Esta función se mantiene como estaba en el código original
}

// Función para volver a la página de selección de cafeterías
function volverAInicio() {
    window.location.href = 'menu.html';
}

// Función para navegar a diferentes menús
function navigateTo(url) {
    // Agregar una animación de salida antes de navegar
    document.body.classList.add('page-exit');
    
    // Esperar a que termine la animación y luego navegar
    setTimeout(() => {
        window.location.href = url;
    }, 300);
}

// Manejo de error en la carga de imágenes
function handleImageError(img) {
    img.src = "images/default-food.jpg"; // Imagen por defecto
    img.onerror = null;
}

// Función para añadir un item al carrito
function addToCart(e, name, price, cafeteria) {
    // Usar event para obtener la imagen del producto cuando esté disponible
    price = parseFloat(price);
    let imageSrc = '';
    if (e && e.target) {
        // Buscar el elemento .menu-item más cercano
        let menuItem = e.target.closest('.menu-item');
        // Buscar la imagen dentro del contenedor de la tarjeta del producto
        let imageElement = menuItem ? menuItem.querySelector('.menu-item-image img') : null;
        imageSrc = imageElement ? imageElement.src : '';
    }
    
    // Si no hay imagen desde el evento, intentar buscarla por el nombre
    if (!imageSrc) {
        let imageElement = document.querySelector(`img[alt="${name}"]`);
        imageSrc = imageElement ? imageElement.src : '';
    }
    
    // Cargar carrito desde localStorage para asegurar datos actualizados
    const savedCart = localStorage.getItem('upedidosCart');
    if (savedCart) {
        cartItems = JSON.parse(savedCart);
    }
    
    // Buscar si el item ya existe en el carrito
    const existingItemIndex = cartItems.findIndex(item => 
        item.name === name && item.cafeteria === cafeteria);
    
    if (existingItemIndex !== -1) {
        // If already exists, increment quantity
        cartItems[existingItemIndex].quantity += 1;
        if (imageSrc) {
            cartItems[existingItemIndex].image = imageSrc;
        }
    } else {
        // If doesn't exist, add new item
        cartItems.push({
            name: name,
            price: price,  // This should now be a number
            cafeteria: cafeteria,
            image: imageSrc || `${name.toLowerCase().replace(/ - /g, '-').replace(/ /g, '-')}.jpg`,
            quantity: 1
        });
    }
    // Actualizar contador del carrito
    updateCartCount();
    
    // Mostrar notificación
    showToast(`${name} añadido al carrito`);
    
    // Animar el icono del carrito
    animateCartIcon();
    
    // Guardar en localStorage
    saveCartToLocalStorage();
}

// Función para guardar el carrito en localStorage
function saveCartToLocalStorage() {
    localStorage.setItem('upedidosCart', JSON.stringify(cartItems));
}

// Función para guardar pedidos en localStorage
function saveOrdersToLocalStorage() {
    localStorage.setItem('upedidosOrders', JSON.stringify(ordersHistory));
}

// Función para actualizar el contador del carrito
function updateCartCount() {
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    
    // Compatibilidad con ambas versiones del contador
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
        cartBadge.textContent = totalItems;
    }
    
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

// Función para animar el icono del carrito
function animateCartIcon() {
    const cartIcon = document.getElementById('cart-btn');
    if (cartIcon) {
        cartIcon.classList.add('added-animation');
        
        // Quitar la clase después de la animación
        setTimeout(() => {
            cartIcon.classList.remove('added-animation');
        }, 500);
    }
}

// Función para mostrar notificación toast
function showToast(message) {
    // Crear toast si no existe
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
    
    // Ocultar el toast después de 3 segundos
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Función para abrir el modal del carrito
function openCart() {
    renderCartItems();
    document.getElementById('cart-modal').style.display = 'flex';
}

// Función para cerrar el modal del carrito
function closeCart() {
    document.getElementById('cart-modal').style.display = 'none';
}

// Función para renderizar los items del carrito
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    
    // Verificar que el contenedor del carrito exista
    if (!cartItemsContainer) {
        console.error('No se encontró el contenedor de items del carrito');
        return;
    }
    
    cartItemsContainer.innerHTML = '';
    
    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '<p>Tu carrito está vacío.</p>';
        document.getElementById('cart-total').textContent = '$0.00';
        return;
    }
    
    let total = 0;
    
    // Agrupar items por cafetería
    const cafeterias = [...new Set(cartItems.map(item => item.cafeteria))];
    
    cafeterias.forEach(cafeteria => {
        // Obtener color de cafetería
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
        
        // Filtrar items por cafetería
        const cafeteriaItems = cartItems.filter(item => item.cafeteria === cafeteria);
        
        cafeteriaItems.forEach(item => {
            const itemTotal = parseFloat(item.price) * item.quantity;
            total += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            
            // Usar la imagen del producto si está disponible
            const imgSrc = item.image || '/api/placeholder/60/60';
            
            cartItem.innerHTML = `
                <img src="${imgSrc}" alt="${item.name}" class="cart-item-img" onerror="handleImageError(this)">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">$${parseFloat(item.price).toFixed(2)} x ${item.quantity} = $${itemTotal.toFixed(2)}</div>
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
    
    // Actualizar el total
    const cartTotalElement = document.getElementById('cart-total');
    if (cartTotalElement) {
        cartTotalElement.textContent = '$' + total.toFixed(2);
    }
}

// Función para aumentar la cantidad de un item
function increaseQuantity(name, cafeteria) {
    const item = cartItems.find(item => 
        item.name === name && item.cafeteria === cafeteria);
    
    if (item) {
        item.quantity += 1;
        updateCartCount();
        renderCartItems();
        saveCartToLocalStorage();
    }
}

// Función para disminuir la cantidad de un item
function decreaseQuantity(name, cafeteria) {
    const item = cartItems.find(item => 
        item.name === name && item.cafeteria === cafeteria);
    
    if (item && item.quantity > 1) {
        item.quantity -= 1;
        updateCartCount();
        renderCartItems();
        saveCartToLocalStorage();
    } else if (item && item.quantity === 1) {
        removeItem(name, cafeteria);
    }
}

// Función para eliminar un item
function removeItem(name, cafeteria) {
    cartItems = cartItems.filter(item => 
        !(item.name === name && item.cafeteria === cafeteria));
    updateCartCount();
    renderCartItems();
    saveCartToLocalStorage();
}

// Funciones para obtener tiempo actual y tiempo de recogida
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
    const randomMinutes = Math.floor(Math.random() * (120 - 30 + 1) + 30); // Entre 30 y 120 minutos
    now.setMinutes(now.getMinutes() + randomMinutes);
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

// Función para hacer el pedido
function checkout() {
    if (cartItems.length === 0) {
        showToast('Tu carrito está vacío');
        return;
    }
    
    // Obtener el método de pago seleccionado (si existe el radio button)
    let selectedPayment = "efectivo"; // Método por defecto
    const paymentRadio = document.querySelector('input[name="payment"]:checked');
    if (paymentRadio) {
        selectedPayment = paymentRadio.value;
    }
    
    const orderTime = getCurrentTime();
    
    // Añadir cada item del carrito al historial de pedidos
    cartItems.forEach(item => {
        const orderId = Date.now() + Math.floor(Math.random() * 1000);
        ordersHistory.push({
            id: orderId,
            name: item.name,
            description: "", // Puedes agregar descripción si la tienes
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
    
    // Guardar pedidos en localStorage
    saveOrdersToLocalStorage();
    
    showToast('¡Gracias por tu pedido! Tu comida estará lista pronto.');
    
    // Vaciar el carrito después del pedido
    cartItems = [];
    updateCartCount();
    closeCart();
    saveCartToLocalStorage();
    
    // Si existe renderOrdersHistory y estamos en la página de pedidos, actualizar la vista
    if (typeof renderOrdersHistory === 'function' && document.getElementById('pedidos-pendientes')) {
        renderOrdersHistory();
    }
    
    // Opcionalmente, redirigir a la página de pedidos
    // navigateTo('pedidos.html');
}

// Función para marcar un pedido como retirado
function markAsPickedUp(orderId) {
    const orderIndex = ordersHistory.findIndex(order => order.id == orderId);
    if (orderIndex !== -1) {
        ordersHistory[orderIndex].status = "retirado";
        saveOrdersToLocalStorage();
        renderOrdersHistory();
        showToast('Pedido marcado como retirado');
    }
}

// Función para verificar pedidos expirados
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
    if (document.getElementById('pedidos-pendientes')) {
        renderOrdersHistory();
    }
}

// Función para renderizar el historial de pedidos
function renderOrdersHistory() {
    const pendingContainer = document.getElementById('pedidos-pendientes');
    const expiredContainer = document.getElementById('pedidos-expirados');
    
    if (!pendingContainer || !expiredContainer) {
        return; // Si no estamos en la página de pedidos, salir
    }
    
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

// Función para renderizar un item de pedido
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

// Función para cargar productos de ejemplo (si aplica)
function loadSampleProducts() {
    const productos = [
        { name: "Almuerzo - Opción 1", price: 8.50, cafeteria: "Cafetería #3" },
        { name: "Cena - Opción 1", price: 7.50, cafeteria: "Cafetería #3" },
        { name: "Desayuno - Opción 3", price: 5.00, cafeteria: "Cafetería #1" }
    ];

    const productContainer = document.getElementById('product-container');
    if (productContainer) {
        productContainer.innerHTML = '';

        productos.forEach(producto => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card menu-item';  // Agregar ambas clases para compatibilidad

            productCard.innerHTML = `
                <div class="menu-item-image">
                    <img src="/api/placeholder/200/150" alt="${producto.name}" class="product-img">
                </div>
                <div class="product-title">${producto.name}</div>
                <div class="product-price">$${producto.price.toFixed(2)}</div>
                <button class="add-to-cart-btn" onclick="addToCart(event, '${producto.name}', ${producto.price}, '${producto.cafeteria}')">
                    <i class="fas fa-plus"></i> Añadir
                </button>
            `;

            productContainer.appendChild(productCard);
        });
    }
}

// Agregar animación de entrada a la página
window.addEventListener('load', function() {
    document.body.classList.add('page-loaded');
    
    // Animar la entrada de las cafeterías secuencialmente
    const cafeterias = document.querySelectorAll('.cafeteria');
    cafeterias.forEach((cafeteria, index) => {
        setTimeout(() => {
            cafeteria.classList.add('cafeteria-loaded');
        }, 200 * (index + 1));
    });
});