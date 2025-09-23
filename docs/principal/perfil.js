document.addEventListener('DOMContentLoaded', function() {
    // Obtener datos del usuario del almacenamiento local
    const email = localStorage.getItem('utpedidos_email') || sessionStorage.getItem('utpedidos_email');
    const userData = localStorage.getItem('utpedidos_userData');
    let userObj = {};
    
    // Variable global para el carrito
    let cartItems = [];
    
    // Cargar carrito desde localStorage
    const savedCart = localStorage.getItem('upedidosCart');
    if (savedCart) {
        cartItems = JSON.parse(savedCart);
    }
    
    if (userData) {
        userObj = JSON.parse(userData);
        
        // Llenar el formulario con los datos guardados
        document.getElementById('nombre').value = userObj.nombre || '';
        document.getElementById('apellido').value = userObj.apellido || '';
        document.getElementById('email').value = email || '';
        document.getElementById('telefono').value = userObj.telefono || '';
        document.getElementById('facultad').value = userObj.facultad || '';
        document.getElementById('edificio').value = userObj.edificio || '';
        
        // Actualizar nombre del perfil en el div profile-info
        if (userObj.nombre && userObj.apellido) {
            document.getElementById('profile-name').textContent = userObj.nombre + ' ' + userObj.apellido;
        }
    } else if (email) {
        // Si solo tenemos el email pero no hay datos de usuario
        document.getElementById('email').value = email;
        
        // Extraer el nombre de usuario del correo (parte antes del @)
        const userName = email.split('@')[0];
        // Capitalizar la primera letra y reemplazar puntos por espacios
        const formattedName = userName
            .split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        
        // Actualizar textos con el nombre
        document.getElementById('welcome-text').textContent = 'Bienvenido, ' + formattedName;
        
        // Actualizar el nombre en el div profile-info
        document.getElementById('profile-name').textContent = formattedName;
        
        // Obtener nombre y apellido separados (si es posible)
        const nameParts = formattedName.split(' ');
        if (nameParts.length >= 2) {
            document.getElementById('nombre').value = nameParts[0];
            document.getElementById('apellido').value = nameParts.slice(1).join(' ');
        } else {
            document.getElementById('nombre').value = formattedName;
        }
    }
    
    // Actualizar el correo mostrado en el div profile-info
    if (email) {
        document.getElementById('profile-email').textContent = email;
        
        // Configurar inicial del avatar
        const initial = (userObj.nombre && userObj.nombre[0]) || 
                       (email && email[0].toUpperCase()) || 'U';
        document.getElementById('avatar-initial').textContent = initial;
    }
    
    // Actualizar contador del carrito
    updateCartCount();
    
    // Cargar historial de pedidos
    loadOrderHistory();
    
    // Event listener para guardar datos del perfil
    document.getElementById('profile-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Recopilar datos del formulario
        const userData = {
            nombre: document.getElementById('nombre').value,
            apellido: document.getElementById('apellido').value,
            telefono: document.getElementById('telefono').value,
            facultad: document.getElementById('facultad').value,
            edificio: document.getElementById('edificio').value
        };
        
        // Guardar en localStorage
        localStorage.setItem('utpedidos_userData', JSON.stringify(userData));
        
        // Actualizar nombre del perfil en el div profile-info
        document.getElementById('profile-name').textContent = userData.nombre + ' ' + userData.apellido;
        
        // Actualizar la inicial del avatar
        if (userData.nombre) {
            document.getElementById('avatar-initial').textContent = userData.nombre[0].toUpperCase();
        }
        
        // Actualizar texto de bienvenida en la navbar
        document.getElementById('welcome-text').textContent = 'Bienvenido, ' + userData.nombre;
        
        // Mostrar notificación
        showToast('Perfil actualizado correctamente');
    });
    
    // Event listener para cerrar sesión
    document.getElementById('logout-btn').addEventListener('click', function() {
        // Mostrar confirmación
        if (confirm('¿Estás seguro de que deseas cerrar sesión? Se eliminarán todos tus datos guardados.')) {
            // Eliminar todos los datos relacionados con la aplicación
            localStorage.removeItem('utpedidos_email');
            localStorage.removeItem('utpedidos_userData');
            localStorage.removeItem('upedidosCart');
            localStorage.removeItem('utpedidos_orders');
            sessionStorage.removeItem('utpedidos_email');
            
            // Mostrar mensaje de éxito antes de redirigir
            showToast('Sesión cerrada correctamente. Todos los datos han sido eliminados.');
            
            // Esperar un momento para que se vea el mensaje
            setTimeout(function() {
                // Redirigir a la página de inicio de sesión
                window.location.href = '../index.html';
            }, 1500);
        }
    });

    // Añadir evento al botón de carrito
    const cartBtn = document.querySelector('.nav-button[title="Carrito"]');
    if (cartBtn) {
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openCart();
        });
    }
});

// Función para actualizar el contador del carrito
function updateCartCount() {
    const savedCart = localStorage.getItem('upedidosCart');
    let cartItems = savedCart ? JSON.parse(savedCart) : [];
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
        cartBadge.textContent = totalItems;
    }
}

// Función para cargar el historial de pedidos
function loadOrderHistory() {
    const savedOrders = localStorage.getItem('utpedidos_orders');
    let orders = savedOrders ? JSON.parse(savedOrders) : [];
    
    const ordersContainer = document.getElementById('orders-container');
    
    if (orders.length === 0) {
        ordersContainer.innerHTML = '<p>No has realizado ningún pedido aún.</p>';
        return;
    }
    
    // Ordenar por fecha más reciente primero (si hay fechas)
    if (orders[0].fecha) {
        orders.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }
    
    // Mostrar solo los últimos 5 pedidos
    orders = orders.slice(0, 5);
    
    ordersContainer.innerHTML = '';
    
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        const fecha = order.fecha ? new Date(order.fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Fecha no disponible';
        
        const totalPedido = order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        orderCard.innerHTML = `
            <div class="order-header">
                <strong>Pedido #${order.id || '???'}</strong>
                <span>${fecha}</span>
            </div>
            <div>Cafetería: ${order.cafeteria || 'Múltiple'}</div>
            <div>Total: $${totalPedido.toFixed(2)}</div>
            <div>Estado: ${order.estado || 'Completado'}</div>
            <div class="order-items">
                <strong>categoria:</strong>
                <ul>
                    ${order.items.map(item => `
                        <li>${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>
                    `).join('')}
                </ul>
            </div>
        `;
        
        ordersContainer.appendChild(orderCard);
    });
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

// FUNCIONES DEL CARRITO
function openCart() {
    // Crear modal del carrito si no existe
    let cartModal = document.getElementById('cart-modal');
    if (!cartModal) {
        cartModal = document.createElement('div');
        cartModal.id = 'cart-modal';
        cartModal.className = 'modal';
        cartModal.style.display = 'none';
        cartModal.style.position = 'fixed';
        cartModal.style.zIndex = '1000';
        cartModal.style.left = '0';
        cartModal.style.top = '0';
        cartModal.style.width = '100%';
        cartModal.style.height = '100%';
        cartModal.style.overflow = 'auto';
        cartModal.style.backgroundColor = 'rgba(0,0,0,0.4)';
        cartModal.style.display = 'flex';
        cartModal.style.justifyContent = 'center';
        cartModal.style.alignItems = 'center';
        
        cartModal.innerHTML = `
            <div class="modal-content" style="background-color: white; padding: 20px; border-radius: 8px; width: 90%; max-width: 500px;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0;">Mi Carrito</h3>
                    <span class="close" onclick="closeCart()" style="cursor: pointer; font-size: 24px; font-weight: bold;">&times;</span>
                </div>
                <div id="cart-items" style="max-height: 50vh; overflow-y: auto; margin-bottom: 15px;"></div>
                <div class="cart-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                    <div class="total" style="font-size: 18px; font-weight: bold;">
                        Total: <span id="cart-total">$0.00</span>
                    </div>
                    <div class="payment-methods" style="margin: 15px 0;">
                        <div style="margin-bottom: 10px;">Método de pago:</div>
                        <label style="margin-right: 15px;">
                            <input type="radio" name="payment" value="efectivo" checked> Efectivo
                        </label>
                        <label>
                            <input type="radio" name="payment" value="visa"> Tarjeta Visa
                        </label>
                    </div>
                    <button onclick="checkout()" style="background-color: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">
                        Realizar pedido
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(cartModal);
    } else {
        cartModal.style.display = 'flex';
    }
    
    renderCartItems();
}

function closeCart() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.style.display = 'none';
    }
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    if (!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = '';
    
    const savedCart = localStorage.getItem('upedidosCart');
    let cartItems = savedCart ? JSON.parse(savedCart) : [];
    
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
            cartItem.style.display = 'flex';
            cartItem.style.alignItems = 'center';
            cartItem.style.margin = '10px 0';
            cartItem.style.padding = '10px';
            cartItem.style.borderRadius = '8px';
            cartItem.style.backgroundColor = '#f9f9f9';
            
            // Verificar imagen: si no existe, usar placeholder
            let imgSrc = (item.image && item.image !== '') ? item.image : '../imagenes/placeholder-food.png';
            
            cartItem.innerHTML = `
                <div class="cart-item-img-container" style="width: 60px; height: 60px; overflow: hidden; border-radius: 8px; margin-right: 10px;">
                    <img src="${imgSrc}" alt="${item.name}" class="cart-item-img" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='../imagenes/placeholder-food.png'">
                </div>
                <div class="cart-item-details" style="flex-grow: 1;">
                    <div class="cart-item-title" style="font-weight: bold;">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} x ${item.quantity} = $${itemTotal.toFixed(2)}</div>
                </div>
                <div class="cart-item-actions" style="display: flex; align-items: center;">
                    <div class="cart-item-quantity" style="display: flex; align-items: center; margin-right: 10px;">
                        <button class="qty-btn" onclick="decreaseQuantity('${item.name}', '${item.cafeteria}')" style="width: 25px; height: 25px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">-</button>
                        <span class="qty-value" style="margin: 0 8px;">${item.quantity}</span>
                        <button class="qty-btn" onclick="increaseQuantity('${item.name}', '${item.cafeteria}')" style="width: 25px; height: 25px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">+</button>
                    </div>
                    <button class="remove-item" onclick="removeItem('${item.name}', '${item.cafeteria}')" style="background: none; border: none; font-size: 20px; color: #ff6b6b; cursor: pointer;">×</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItem);
        });
    });
    
    document.getElementById('cart-total').textContent = '$' + total.toFixed(2);
}

function increaseQuantity(name, cafeteria) {
    const savedCart = localStorage.getItem('upedidosCart');
    let cartItems = savedCart ? JSON.parse(savedCart) : [];
    
    const item = cartItems.find(item => item.name === name && item.cafeteria === cafeteria);
    if (item) {
        item.quantity += 1;
        localStorage.setItem('upedidosCart', JSON.stringify(cartItems));
        updateCartCount();
        renderCartItems();
    }
}

function decreaseQuantity(name, cafeteria) {
    const savedCart = localStorage.getItem('upedidosCart');
    let cartItems = savedCart ? JSON.parse(savedCart) : [];
    
    const item = cartItems.find(item => item.name === name && item.cafeteria === cafeteria);
    if (item && item.quantity > 1) {
        item.quantity -= 1;
        localStorage.setItem('upedidosCart', JSON.stringify(cartItems));
        updateCartCount();
        renderCartItems();
    } else if (item && item.quantity === 1) {
        removeItem(name, cafeteria);
    }
}

function removeItem(name, cafeteria) {
    const savedCart = localStorage.getItem('upedidosCart');
    let cartItems = savedCart ? JSON.parse(savedCart) : [];
    
    cartItems = cartItems.filter(item => !(item.name === name && item.cafeteria === cafeteria));
    localStorage.setItem('upedidosCart', JSON.stringify(cartItems));
    updateCartCount();
    renderCartItems();
}

function checkout() {
    const savedCart = localStorage.getItem('upedidosCart');
    let cartItems = savedCart ? JSON.parse(savedCart) : [];
    
    if (cartItems.length === 0) {
        showToast('Tu carrito está vacío');
        return;
    }
    
    // Obtener método de pago
    const selectedPayment = document.querySelector('input[name="payment"]:checked').value;
    
    // Crear objeto de pedido
    const now = new Date();
    const orderId = Date.now();
    const order = {
        id: orderId,
        fecha: now.toISOString(),
        cafeteria: cartItems.length === 1 ? cartItems[0].cafeteria : 'Múltiple',
        items: cartItems,
        estado: 'Pendiente',
        metodoPago: selectedPayment
    };
    
    // Guardar el pedido
    const savedOrders = localStorage.getItem('utpedidos_orders');
    let orders = savedOrders ? JSON.parse(savedOrders) : [];
    orders.unshift(order);
    localStorage.setItem('utpedidos_orders', JSON.stringify(orders));
    
    // Limpiar carrito
    localStorage.setItem('upedidosCart', JSON.stringify([]));
    
    // Actualizar interfaz
    updateCartCount();
    loadOrderHistory();
    closeCart();
    
    showToast('¡Pedido realizado con éxito!');
}

// Añadir estilos CSS para el carrito si no existen

// Asegurarse de que los estilos se carguen
document.addEventListener('DOMContentLoaded', addCartStyles);
function volverAInicio() {
    window.location.href = '../menu/menu.html';
}