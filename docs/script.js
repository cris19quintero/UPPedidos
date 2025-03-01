        // Función para alternar la visibilidad de la contraseña
        function togglePasswordVisibility() {
            const passwordInput = document.getElementById('password');
            const toggleIcon = document.querySelector('.toggle-password svg');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
                    <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88"></path>
                    <path d="M1 1l22 22"></path>
                `;
            } else {
                passwordInput.type = 'password';
                toggleIcon.innerHTML = `
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        }

        // Recuperar credenciales guardadas al cargar la página
        document.addEventListener('DOMContentLoaded', function() {
            const savedEmail = localStorage.getItem('utpedidos_email');
            const savedRemember = localStorage.getItem('utpedidos_remember');
            
            if (savedEmail && savedRemember === 'true') {
                document.getElementById('email').value = savedEmail;
                document.getElementById('remember').checked = true;
            }
        });

        // Guardar credenciales al enviar el formulario
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('remember').checked;
            
            // Guardar credenciales si se selecciona "Recordarme"
            if (rememberMe) {
                localStorage.setItem('utpedidos_email', email);
                localStorage.setItem('utpedidos_remember', 'true');
            } else {
                localStorage.removeItem('utpedidos_email');
                localStorage.removeItem('utpedidos_remember');
            }
        });
        // Función para alternar la visibilidad de la contraseña
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.toggle-password svg');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
            <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88"></path>
            <path d="M1 1l22 22"></path>
        `;
    } else {
        passwordInput.type = 'password';
        toggleIcon.innerHTML = `
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        `;
    }
}

// Recuperar credenciales guardadas al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    const savedEmail = localStorage.getItem('utpedidos_email');
    const savedRemember = localStorage.getItem('utpedidos_remember');
    
    if (savedEmail && savedRemember === 'true') {
        document.getElementById('email').value = savedEmail;
        document.getElementById('remember').checked = true;
    }
});

// Función para mostrar mensajes de notificación
function showNotification(message, isError = false) {
    // Crear el elemento de notificación si no existe
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        document.querySelector('.login-form').appendChild(notification);
    }
    
    // Establecer estilo según tipo de mensaje
    notification.className = isError ? 'notification error' : 'notification success';
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Ocultar la notificación después de 3 segundos
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Guardar credenciales y validar al enviar el formulario
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember').checked;
    
    // Guardar credenciales si se selecciona "Recordarme"
    if (rememberMe) {
        localStorage.setItem('utpedidos_email', email);
        localStorage.setItem('utpedidos_remember', 'true');
    } else {
        localStorage.removeItem('utpedidos_email');
        localStorage.removeItem('utpedidos_remember');
    }
    
    // Aquí deberías validar las credenciales contra tu backend
    // Este es un ejemplo simple para demostración
    if (validateCredentials(email, password)) {
        // Mostrar mensaje de éxito
        showNotification('Inicio de sesión exitoso. Redirigiendo...');
        
        // Redirigir a la página principal después de un breve retraso
        setTimeout(() => {
            window.location.href = "principal/principal.html"; 
        }, 1500);
        
    } else {
        // Mostrar mensaje de error
        showNotification('Correo electrónico o contraseña incorrectos', true);
    }
});

// Función para validar credenciales (ejemplo)
function validateCredentials(email, password) {
    // NOTA: Esta es solo una validación de ejemplo
    // En un sistema real, deberías validar contra tu backend/servidor
    
    // Verificar si es un correo de la UTP
    const isUTPEmail = email.endsWith('@utp.ac.pa');
    
    // Verificar que la contraseña tenga al menos 6 caracteres
    const isValidPassword = password.length >= 6;
    
    return isUTPEmail && isValidPassword;
}