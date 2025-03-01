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
            const y = e.clientY - rect.top;  // Posición Y del mouse dentro del elemento
            
            // Calcular rotación basada en la posición del cursor
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const maxRotation = 10;
            const rotateY = maxRotation * (x - centerX) / centerX;
            const rotateX = -maxRotation * (y - centerY) / centerY;
            
            // Aplicar transformación
            cafeteria.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });
        
        cafeteria.addEventListener('mouseleave', function() {
            cafeteria.style.transition = 'transform 0.5s ease';
            cafeteria.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
            setTimeout(() => {
                cafeteria.style.transition = '';
            }, 500);
        });
    });
    
    // Cargar carrito desde localStorage
    updateCartCount();
    
    // Agregar event listener al botón del carrito
    document.querySelector('.nav-button[title="Carrito"]').addEventListener('click', function(e) {
        e.preventDefault();
        openCart();
    });
});

// Función para cambiar entre cafeterías
function cambiarCafeteria(cafeteriaId) {
    // Implementación de la función de cambio de cafetería (si aplica)
}

// Función para volver a la página de selección de cafeterías
function volverAInicio() {
    window.location.href = 'menu.html';
}

// Función para navegar a diferentes menús
function navigateTo(url) {
    document.body.classList.add('page-exit');
    setTimeout(() => {
        window.location.href = url;
    }, 300);
}

/* === Función mejorada para añadir un item al carrito ===
     Ahora utiliza el parámetro "e" para obtener la imagen del producto */
function addToCart(e, name, price, cafeteria) {
    // Encontrar la imagen del producto de manera más robusta
    let imageSrc = '';
    if (e && e.target) {
        const menuItem = e.target.closest('.menu-item');
        if (menuItem) {
            const imageElement = menuItem.querySelector('.menu-item-image img');
            if (imageElement && imageElement.src) {
                imageSrc = imageElement.src;
                console.log("Imagen encontrada:", imageSrc); // Depuración
            }
        }
    }
    // Si no se encontró la imagen, buscar por nombre en el documento
    if (!imageSrc || imageSrc === '') {
        const allImages = document.querySelectorAll('.menu-item-image img');
        for (let img of allImages) {
            if (img.alt === name || img.closest('.menu-item').querySelector('h4').textContent === name) {
                imageSrc = img.src;
                console.log("Imagen encontrada por nombre:", imageSrc); // Depuración
                break;
            }
        }
    }
    
    // Convertir el precio a número (si fuese necesario)
    price = parseFloat(price);
    
    // Cargar carrito desde localStorage
    const savedCart = localStorage.getItem('upedidosCart');
    let cartItems = savedCart ? JSON.parse(savedCart) : [];
    
    // Buscar si el item ya existe en el carrito
    const existingItemIndex = cartItems.findIndex(item => 
        item.name === name && item.cafeteria === cafeteria);
    
    if (existingItemIndex !== -1) {
        cartItems[existingItemIndex].quantity += 1;
        // Actualizar la imagen si se encontró una nueva
        if (imageSrc && imageSrc !== '') {
            cartItems[existingItemIndex].image = imageSrc;
        }
    } else {
        cartItems.push({
            name: name,
            price: price,
            cafeteria: cafeteria,
            image: imageSrc,
            quantity: 1
        });
    }
    
    updateCartCount();
    showToast(`${name} añadido al carrito`);
    animateCartIcon();
    localStorage.setItem('upedidosCart', JSON.stringify(cartItems));
}

// Función para actualizar el contador del carrito
function updateCartCount() {
    const savedCart = localStorage.getItem('upedidosCart');
    let cartItems = savedCart ? JSON.parse(savedCart) : [];
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) { cartBadge.textContent = totalItems; }
    const cartCount = document.getElementById('cart-count');
    if (cartCount) { cartCount.textContent = totalItems; }
}

// Función para animar el icono del carrito
function animateCartIcon() {
    const cartIcon = document.getElementById('cart-btn');
    if (cartIcon) {
        cartIcon.classList.add('added-animation');
        setTimeout(() => {
            cartIcon.classList.remove('added-animation');
        }, 500);
    }
}

// Función para mostrar notificación toast
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

// Función para abrir el modal del carrito
function openCart() {
    renderCartItems();
    document.getElementById('cart-modal').style.display = 'flex';
}

// Función para cerrar el modal del carrito
function closeCart() {
    document.getElementById('cart-modal').style.display = 'none';
}

/* === Función mejorada para renderizar los items del carrito === */
function renderCartItems() {
    const savedCart = localStorage.getItem('upedidosCart');
    let cartItems = savedCart ? JSON.parse(savedCart) : [];
    
    const cartItemsContainer = document.getElementById('cart-items');
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
        
        // Encabezado de la cafetería
        const cafeteriaHeader = document.createElement('h4');
        cafeteriaHeader.textContent = cafeteria;
        cafeteriaHeader.style.marginTop = '15px';
        cafeteriaHeader.style.padding = '5px';
        cafeteriaHeader.style.borderRadius = '8px';
        cafeteriaHeader.style.backgroundColor = cafeteriaColor;
        cafeteriaHeader.style.color = 'white';
        cartItemsContainer.appendChild(cafeteriaHeader);
        
        // Filtrar items de la misma cafetería
        const cafeteriaItems = cartItems.filter(item => item.cafeteria === cafeteria);
        cafeteriaItems.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            
            // Verificar si existe una imagen; si no, usar placeholder
            let imgSrc = item.image && item.image !== '' ? item.image : '../imagenes/placeholder-food.png';
            // Intentar actualizar la imagen basándonos en el nombre si es necesario
            if ((!item.image || item.image === '') && document.querySelectorAll('.menu-item').length > 0) {
                const menuItems = document.querySelectorAll('.menu-item');
                for (let menuItem of menuItems) {
                    const title = menuItem.querySelector('h4');
                    if (title && title.textContent === item.name) {
                        const img = menuItem.querySelector('.menu-item-image img');
                        if (img && img.src) {
                            imgSrc = img.src;
                            item.image = imgSrc; // Actualizar el item en el carrito
                            break;
                        }
                    }
                }
            }
            
            cartItem.innerHTML = `
                <div class="cart-item-img-container">
                    <img src="${imgSrc}" alt="${item.name}" class="cart-item-img" onerror="this.src='../imagenes/placeholder-food.png'">
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
    // Guardar el carrito actualizado (con imágenes, si se encontraron)
    localStorage.setItem('upedidosCart', JSON.stringify(cartItems));
}

// Función para aumentar la cantidad de un item
function increaseQuantity(name, cafeteria) {
    const savedCart = localStorage.getItem('upedidosCart');
    let cartItems = savedCart ? JSON.parse(savedCart) : [];
    const item = cartItems.find(item => item.name === name && item.cafeteria === cafeteria);
    if (item) {
        item.quantity += 1;
        updateCartCount();
        renderCartItems();
        localStorage.setItem('upedidosCart', JSON.stringify(cartItems));
    }
}

// Función para disminuir la cantidad de un item
function decreaseQuantity(name, cafeteria) {
    const savedCart = localStorage.getItem('upedidosCart');
    let cartItems = savedCart ? JSON.parse(savedCart) : [];
    const item = cartItems.find(item => item.name === name && item.cafeteria === cafeteria);
    if (item && item.quantity > 1) {
        item.quantity -= 1;
        updateCartCount();
        renderCartItems();
        localStorage.setItem('upedidosCart', JSON.stringify(cartItems));
    } else if (item && item.quantity === 1) {
        removeItem(name, cafeteria);
    }
}

// Función para eliminar un item
function removeItem(name, cafeteria) {
    const savedCart = localStorage.getItem('upedidosCart');
    let cartItems = savedCart ? JSON.parse(savedCart) : [];
    cartItems = cartItems.filter(item => !(item.name === name && item.cafeteria === cafeteria));
    updateCartCount();
    renderCartItems();
    localStorage.setItem('upedidosCart', JSON.stringify(cartItems));
}

// Función para hacer el pedido
// Función para hacer el pedido
function checkout() {
    // Cargar carrito desde localStorage para asegurar datos actualizados
    const savedCart = localStorage.getItem('upedidosCart');
    let cartItems = savedCart ? JSON.parse(savedCart) : [];
    
    if (cartItems.length === 0) {
        showToast('Tu carrito está vacío');
        return;
    }
    
    // Cargar pedidos desde localStorage si existen
    let ordersHistory = [];
    const savedOrders = localStorage.getItem('upedidosOrders');
    if (savedOrders) {
        ordersHistory = JSON.parse(savedOrders);
    }
    
    // Obtener el método de pago seleccionado (si existe el selector)
    let selectedPayment = "efectivo"; // Método por defecto
    const paymentRadio = document.querySelector('input[name="payment"]:checked');
    if (paymentRadio) {
        selectedPayment = paymentRadio.value;
    }
    
    // Obtener tiempos de pedido y recogida
    const orderTime = getCurrentTime();
    const pickupTime = getPickupTime();
    
    // Añadir cada item del carrito al historial de pedidos
    cartItems.forEach(item => {
        const orderId = Date.now() + Math.floor(Math.random() * 1000);
        ordersHistory.push({
            id: orderId,
            name: item.name,
            description: "", // Opcional: puedes agregar descripción si la tienes
            price: parseFloat(item.price),
            quantity: item.quantity,
            cafeteria: item.cafeteria,
            orderTime: orderTime,
            pickupTime: pickupTime,
            paymentMethod: selectedPayment,
            status: "pendiente",
            image: item.image || `${item.name.toLowerCase().replace(/ - /g, '-').replace(/ /g, '-')}.jpg`
        });
    });
    
    // Guardar pedidos en localStorage
    localStorage.setItem('upedidosOrders', JSON.stringify(ordersHistory));
    
    showToast('¡Gracias por tu pedido! Tu comida estará lista pronto.');
    
    // Vaciar el carrito después del pedido
    cartItems = [];
    localStorage.setItem('upedidosCart', JSON.stringify(cartItems));
    updateCartCount();
    closeCart();
    
    // Si existe renderOrdersHistory y estamos en la página de pedidos, actualizar la vista
    if (typeof renderOrdersHistory === 'function' && document.getElementById('pedidos-pendientes')) {
        renderOrdersHistory();
    } else {
        // Opcionalmente, redirigir a la página de pedidos
        // window.location.href = 'pedidos.html';
    }
}

// Funciones auxiliares para tiempo de pedido y recogida
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
    // Entre 30 y 120 minutos de tiempo de preparación
    const randomMinutes = Math.floor(Math.random() * (120 - 30 + 1) + 30);
    now.setMinutes(now.getMinutes() + randomMinutes);
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
}