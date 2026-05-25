/**
 * CineFlix - Funcionalidad del Cliente
 * Control de formularios AJAX, validación y notificaciones Toast
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar contenedores de notificaciones
    initToastContainer();

    // Capturar formulario de inicio de sesión
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Capturar formulario de registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

/**
 * Inicializar el contenedor de notificaciones en el DOM
 */
function initToastContainer() {
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
}

/**
 * Mostrar una notificación estilo Toast
 * @param {string} title - Título del toast
 * @param {string} message - Descripción
 * @param {string} type - 'success' o 'error'
 */
function showToast(title, message, type = 'success') {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close" type="button">&times;</button>
    `;

    // Insertar en el contenedor
    container.appendChild(toast);

    // Sonido sutil o vibración si el navegador lo soporta (opcional)
    if (type === 'error' && navigator.vibrate) {
        navigator.vibrate(100);
    }

    // Evento de cierre manual
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        removeToast(toast);
    });

    // Cierre automático después de 4 segundos
    setTimeout(() => {
        removeToast(toast);
    }, 4000);
}

/**
 * Remover un Toast con animación suave
 * @param {HTMLElement} toast 
 */
function removeToast(toast) {
    toast.style.animation = 'slideOut 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
    toast.addEventListener('animationend', (e) => {
        if (e.animationName === 'slideOut') {
            toast.remove();
        }
    });
}

// Agregar regla CSS para la animación de salida en tiempo de ejecución
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes slideOut {
    0% { opacity: 1; transform: translateX(0); }
    100% { opacity: 0; transform: translateX(100px); }
}
`;
document.head.appendChild(styleSheet);


/**
 * Manejar el envío de Login vía AJAX
 */
async function handleLogin(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('.btn-submit');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showToast('Campos Incompletos', 'Por favor, llena todos los campos obligatorios.', 'error');
        return;
    }

    // Deshabilitar botón para evitar múltiples clics
    setLoadingState(submitBtn, true, 'Verificando...');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            showToast('¡Bienvenido!', data.message, 'success');
            // Redirigir después de 1.2 segundos para dejar leer la notificación
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1200);
        } else {
            showToast('Error de Acceso', data.message || 'Credenciales inválidas.', 'error');
            setLoadingState(submitBtn, false, 'Entrar');
        }

    } catch (error) {
        console.error('Error:', error);
        showToast('Error del Servidor', 'Ocurrió un problema de red. Intenta de nuevo.', 'error');
        setLoadingState(submitBtn, false, 'Entrar');
    }
}

/**
 * Manejar el envío de Registro vía AJAX
 */
async function handleRegister(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('.btn-submit');
    
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validaciones del lado del cliente
    if (!nombre || !apellido || !username || !email || !password || !confirmPassword) {
        showToast('Campos Vacíos', 'Todos los campos son requeridos.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showToast('Contraseña Diferente', 'Las contraseñas ingresadas no coinciden.', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Contraseña Corta', 'La contraseña debe tener al menos 6 caracteres.', 'error');
        return;
    }

    // Deshabilitar botón
    setLoadingState(submitBtn, true, 'Creando Cuenta...');

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, apellido, username, email, password })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Registro Completado', '¡Tu cuenta ha sido creada exitosamente!', 'success');
            // Redirigir tras retraso
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1200);
        } else {
            showToast('Error de Registro', data.message || 'No se pudo crear la cuenta.', 'error');
            setLoadingState(submitBtn, false, 'Crear Cuenta');
        }

    } catch (error) {
        console.error('Error:', error);
        showToast('Error del Servidor', 'Ocurrió un problema de conexión. Intente más tarde.', 'error');
        setLoadingState(submitBtn, false, 'Crear Cuenta');
    }
}

/**
 * Modificar el estado del botón durante peticiones
 */
function setLoadingState(button, isLoading, text) {
    if (isLoading) {
        button.disabled = true;
        button.setAttribute('data-original-text', button.innerHTML);
        button.innerHTML = `<span class="spinner"></span> ${text}`;
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
    } else {
        button.disabled = false;
        button.innerHTML = button.getAttribute('data-original-text') || text;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    }
}

// Estilo del Spinner de Carga
const spinnerStyle = document.createElement("style");
spinnerStyle.innerText = `
.spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 0.8s linear infinite;
    margin-right: 5px;
    vertical-align: middle;
}
@keyframes spin {
    to { transform: rotate(360deg); }
}
`;
document.head.appendChild(spinnerStyle);
