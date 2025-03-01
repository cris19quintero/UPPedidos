document.addEventListener('DOMContentLoaded', function() {
    // Mostrar notificación de inicio de sesión exitoso
    const notification = document.getElementById('login-notification');
    notification.style.display = 'block';
    
    // Ocultar la notificación después de 4 segundos (la animación CSS la desvanecerá)
    setTimeout(() => {
        notification.style.display = 'none';
    }, 4000);
    
    // Obtener el nombre de usuario del almacenamiento local o de la sesión
    const email = localStorage.getItem('utpedidos_email') || sessionStorage.getItem('utpedidos_email');
    if (email) {
        // Extraer el nombre de usuario del correo (parte antes del @)
        const userName = email.split('@')[0];
        // Capitalizar la primera letra y reemplazar puntos por espacios
        const formattedName = userName
            .split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        
        // Actualizar el nombre en la interfaz
        document.getElementById('userName').textContent = formattedName;
    }
    
    // Funcionalidad para el botón de continuar
    document.querySelector('.continue-btn').addEventListener('click', function() {
        // Redireccionar a la página de selección de menú o la que corresponda
        window.location.href = '../menu/menu.html'; // Cambiar a la ruta correcta
    });
});